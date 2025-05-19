from enum import Enum
from inspect import Parameter, signature
from types import AsyncGeneratorType, GeneratorType, NoneType, UnionType
from typing import (
    Annotated,
    Any,
    Callable,
    Coroutine,
    Self,
    TypeVar,
    _LiteralGenericAlias,  # type: ignore
    _UnionGenericAlias,  # type: ignore
)
from fastapi.params import Depends
from pydantic import BaseModel
from typing_extensions import _AnnotatedAlias
from ..logger import Logger
from .Exception import SocketManagerScopeException
from .SocketRequest import SocketRequest
from .WebSocket import WebSocket


TGenerator = GeneratorType | AsyncGeneratorType
_TModel = TypeVar("_TModel", bound=BaseModel)
_TScopeCreator = Callable[[SocketRequest], Coroutine[Any, Any, Any | SocketManagerScopeException]]


class SocketManagerScope:
    """Creates a scope for the socket manager handler to be used in :class:`socketify.SocketApp` manager."""

    _BOOL_TRUE_VALUES = set([1, "1", "true", "True"])
    _BOOL_FALSE_VALUES = set([0, "0", "false", "False"])
    use_cache: bool = True
    annotation: type

    def __init__(
        self,
        generators: list[tuple[bool, TGenerator]],
        param_name: str,
        parameter: Parameter,
        event_details: dict[str, str],
    ) -> None:
        if parameter.kind == Parameter.VAR_POSITIONAL or parameter.kind == Parameter.VAR_KEYWORD:
            raise ValueError("Cannot use * or ** in the event function parameters.")

        if parameter.annotation == Parameter.empty:
            raise TypeError(f"Parameter '{param_name}' must have a type annotation.")

        self._event_details = event_details
        self._param_name = param_name
        self._parameter = parameter
        self._default = self._parameter.default if self._parameter.default != Parameter.empty else None
        self._logger = Logger.use("socket")
        self.annotation = self._parameter.annotation
        self._generators: list[tuple[bool, TGenerator]] = generators

    async def init(self) -> "Self":
        if issubclass(self.annotation.__class__, _AnnotatedAlias):
            self._create_scope = await self._create_annotated_scope(self.annotation)
        elif isinstance(self._default, Depends):
            self.use_cache = self._default.use_cache
            self._create_scope = await self._create_depends_scope(self._default)
        elif isinstance(self.annotation, UnionType) or isinstance(self.annotation, _UnionGenericAlias):
            self._create_scope = await self._create_union_scope(self.annotation)
        elif isinstance(self.annotation, _LiteralGenericAlias):
            self._create_scope = await self._create_literal_scope(self.annotation)
        elif isinstance(self.annotation, type) and issubclass(self.annotation, Enum):
            self._create_scope = await self._create_enum_scope(self.annotation)
        elif self.annotation is SocketRequest:
            self._create_scope = await self._create_request_scope()
        elif self.annotation is WebSocket:
            self._create_scope = await self._create_websocket_scope()
        elif isinstance(self.annotation, type) and issubclass(self.annotation, BaseModel):
            self._create_scope = await self._create_model_scope(self.annotation)
        else:
            self._create_scope = await self._create_data_scope(self.annotation)
        return self

    async def __call__(self, req: SocketRequest) -> Any | SocketManagerScopeException:
        result = await self._create_scope(req)
        if isinstance(result, AsyncGeneratorType):
            self._generators.append((self.use_cache, result))
            result = await result.__anext__()
        elif isinstance(result, GeneratorType):
            self._generators.append((self.use_cache, result))
            result = next(result)
        elif isinstance(result, Coroutine):
            result = await result
        return result

    async def _create_annotated_scope(self, annotation: Annotated[..., ...]) -> _TScopeCreator:
        arg = annotation.__args__[0]
        metadata = annotation.__metadata__[0]

        if isinstance(metadata, Depends):
            self.use_cache = metadata.use_cache
            if metadata.dependency is None:
                return await SocketManagerScope(
                    self._generators,
                    self._param_name,
                    Parameter(self._param_name, Parameter.POSITIONAL_ONLY, annotation=arg),
                    self._event_details,
                ).init()
            return await self._create_depends_scope(metadata)
        else:
            return await SocketManagerScope(
                self._generators,
                self._param_name,
                Parameter(self._param_name, Parameter.POSITIONAL_ONLY, annotation=arg),
                self._event_details,
            ).init()

    async def _create_union_scope(self, annotation: UnionType | _UnionGenericAlias) -> _TScopeCreator:
        union_type_creators: list[SocketManagerScope] = []
        does_allow_none = NoneType in annotation.__args__
        if Any in annotation.__args__:
            return await self._create_data_scope(Any)

        for union_type in annotation.__args__:
            if union_type is NoneType:
                continue

            creator = await SocketManagerScope(
                self._generators,
                self._param_name,
                Parameter(self._param_name, Parameter.POSITIONAL_ONLY, annotation=union_type),
                self._event_details,
            ).init()

            union_type_creators.append(creator)

        async def create_scope(req: SocketRequest) -> Any | SocketManagerScopeException:
            for creator in union_type_creators:
                scope = await creator(req)
                if isinstance(scope, creator.annotation):
                    return scope

            if does_allow_none:
                return None

            return self._convert_scope_exception(
                TypeError(f"Parameter '{self._param_name}' must be of type {annotation.__args__}.")
            )

        return create_scope

    async def _create_literal_scope(self, annotation: _LiteralGenericAlias) -> _TScopeCreator:
        args: tuple = annotation.__args__
        does_allow_none = None in args

        creators: list[SocketManagerScope] = []
        allowed_value_types = set([int, bool, str, bytes, Enum, NoneType])
        for arg in args:
            if not any(isinstance(arg, value_type) for value_type in allowed_value_types):
                raise TypeError(f"Literal type arguments must be a value of {allowed_value_types} but got {arg}.")

            creators.append(
                await SocketManagerScope(
                    self._generators,
                    self._param_name,
                    Parameter(self._param_name, Parameter.POSITIONAL_ONLY, annotation=type(arg)),
                    self._event_details,
                ).init()
            )

        async def create_scope(req: SocketRequest) -> Any | SocketManagerScopeException:
            for creator in creators:
                value = await creator(req)
                if value is not None and value in args:
                    return value

            if does_allow_none:
                return None

            return self._convert_scope_exception(TypeError(f"Parameter '{self._param_name}' must be one of {args}."))

        return create_scope

    async def _create_enum_scope(self, annotation: type[Enum]) -> _TScopeCreator:
        enum_keys = set([enum.name for enum in annotation])
        enum_values = set([enum.value for enum in annotation])

        async def create_scope(req: SocketRequest) -> Any | SocketManagerScopeException:
            if not isinstance(req.data, dict):
                return self._convert_scope_exception(
                    TypeError(f"Parameter '{self._param_name}' must be a dict but got {req.data}")
                )

            value = req.data.get(self._param_name, req.from_app.get(self._param_name))

            if value in enum_keys:
                return annotation[value]

            if value in enum_values:
                return annotation(value)

            return self._convert_scope_exception(
                TypeError(
                    f"Parameter '{self._param_name}' must be one of keys{enum_keys} or values{enum_values} but got {value}"
                )
            )

        return create_scope

    async def _create_depends_scope(self, default: Depends) -> _TScopeCreator:
        if default.dependency is None:
            return await SocketManagerScope(
                self._generators,
                self._param_name,
                Parameter(self._param_name, Parameter.POSITIONAL_ONLY, annotation=self.annotation),
                self._event_details,
            ).init()

        dependency = default.dependency
        depend_params = signature(dependency).parameters
        depend_param_creators: dict[str, _TScopeCreator] = {}
        for param_name in depend_params:
            depend_param_creators[param_name] = await SocketManagerScope(
                self._generators, param_name, depend_params[param_name], self._event_details
            ).init()

        async def create_scope(req: SocketRequest) -> Any | GeneratorType:
            depend_scopes: dict[str, Any] = {}
            for param_name, creator in depend_param_creators.items():
                depend_scopes[param_name] = await creator(req)

            return dependency(**depend_scopes)

        return create_scope

    async def _create_request_scope(self) -> _TScopeCreator:
        async def create_scope(req: SocketRequest) -> SocketRequest:
            return req

        return create_scope

    async def _create_websocket_scope(self) -> _TScopeCreator:
        async def create_scope(req: SocketRequest) -> WebSocket:
            return req.socket

        return create_scope

    async def _create_model_scope(self, model: type[_TModel]) -> _TScopeCreator:
        async def create_scope(req: SocketRequest) -> _TModel | SocketManagerScopeException:
            try:
                return model.model_validate(req.data)
            except Exception as e:
                return self._convert_scope_exception(e)

        return create_scope

    async def _create_data_scope(self, annotation: Any | type) -> _TScopeCreator:
        is_any = annotation is Any

        async def create_scope(req: SocketRequest) -> Any | SocketManagerScopeException:
            if isinstance(req.data, list) and self._param_name == "data" and (is_any or annotation is list):
                return req.data

            data_dict = req.data if isinstance(req.data, dict) else {}

            # if param_name is data
            # and req.data or req.from_app doesn't have a key named param_name
            # and parameter annotation is dict
            # and param_name is data and req.data is a dict
            if (
                self._param_name == "data"
                and self._param_name not in (data_dict | req.from_app)
                and (is_any or annotation is dict)
                and (self._param_name == "data" and isinstance(req.data, dict))
            ):
                return getattr(req, self._param_name)

            if self._param_name not in data_dict and self._param_name not in req.from_app:
                return None

            raw_data = data_dict.get(self._param_name, req.from_app.get(self._param_name))

            if is_any or isinstance(raw_data, annotation):
                return raw_data

            if annotation is bool:
                if raw_data in SocketManagerScope._BOOL_TRUE_VALUES:
                    return True
                elif raw_data in SocketManagerScope._BOOL_FALSE_VALUES:
                    return False
                else:
                    return None

            try:
                return annotation(raw_data)  # type: ignore
            except Exception as e:
                return self._convert_scope_exception(e)

        return create_scope

    def _convert_scope_exception(self, exception: Exception) -> SocketManagerScopeException:
        return SocketManagerScopeException(param=self._param_name, exception=exception, **self._event_details)
