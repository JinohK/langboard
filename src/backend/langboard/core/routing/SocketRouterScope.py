from inspect import Parameter, signature
from types import GeneratorType
from typing import Any, Callable, TypeVar
from fastapi.params import Depends
from pydantic import BaseModel
from ...Constants import PROJECT_NAME
from ..logger import Logger
from .SocketRequest import SocketRequest
from .WebSocket import WebSocket


_TModel = TypeVar("_TModel", bound=BaseModel)
_TScopeCreator = Callable[[SocketRequest], Any | GeneratorType | Exception]


class SocketRouterScope:
    """Creates a scope for the socket route handler to be used in :class:`socketify.SocketApp` routes."""

    use_cache: bool = True
    annotation: type

    def __init__(self, event_detail: str, param_name: str, parameter: Parameter):
        self._event_detail = event_detail
        self._param_name = param_name
        self._parameter = parameter
        if (
            self._parameter.kind == self._parameter.VAR_POSITIONAL
            or self._parameter.kind == self._parameter.VAR_KEYWORD
        ):
            raise ValueError("Cannot use * or ** in the event function parameters.")
        self._default = self._parameter.default if self._parameter.default != self._parameter.empty else None
        self._logger = Logger.use(f"{PROJECT_NAME}.socket")
        self.annotation = self._parameter.annotation

        if isinstance(self._default, Depends):
            self.use_cache = self._default.use_cache
            self._create_scope = self._create_depends_scope(self._default)
        elif self._parameter.annotation is SocketRequest:
            self._create_scope = self._create_request_scope()
        elif self._parameter.annotation is WebSocket:
            self._create_scope = self._create_websocket_scope()
        elif issubclass(self._parameter.annotation, BaseModel):
            self._create_scope = self._create_model_scope(self._parameter.annotation)
        else:
            self._create_scope = self._create_data_scope(self._parameter.annotation)

    def __call__(self, req: SocketRequest) -> Any | GeneratorType:
        return self._create_scope(req)

    def _create_depends_scope(self, default: Depends) -> _TScopeCreator:
        depend_params = signature(default.dependency).parameters
        depend_param_creators: dict[str, _TScopeCreator] = {}
        for param_name in depend_params:
            depend_param_creators[param_name] = SocketRouterScope(
                self._event_detail, param_name, depend_params[param_name]
            )

        def create_scope(req: SocketRequest) -> Any | GeneratorType:
            depend_scopes: dict[str, Any] = {}
            for param_name, creator in depend_param_creators.items():
                depend_scopes[param_name] = creator(req)

            return default.dependency(**depend_scopes)

        return create_scope

    def _create_request_scope(self) -> _TScopeCreator:
        def create_scope(req: SocketRequest) -> SocketRequest:
            return req

        return create_scope

    def _create_websocket_scope(self) -> _TScopeCreator:
        def create_scope(req: SocketRequest) -> WebSocket:
            return req.socket

        return create_scope

    def _create_model_scope(self, model: type[_TModel]) -> _TScopeCreator:
        def create_scope(req: SocketRequest) -> _TModel | Exception:
            try:
                return model.model_validate(req.data)
            except Exception as e:
                return e

        return create_scope

    def _create_data_scope(self, annotation: type) -> _TScopeCreator:
        def create_scope(req: SocketRequest) -> Any | Exception:
            if isinstance(req.data, list):
                return req.data

            if (self._param_name == "data" or self._param_name == "route_data") and (
                self._param_name not in getattr(req, self._param_name) and annotation is dict
            ):
                return getattr(req, self._param_name)

            data = req.data or {}
            if self._param_name not in data and self._param_name not in req.route_data:
                return None

            raw_data = data.get(self._param_name, req.route_data.get(self._param_name))
            if isinstance(raw_data, annotation):
                return raw_data

            try:
                return annotation(raw_data)
            except Exception as e:
                return e

        return create_scope
