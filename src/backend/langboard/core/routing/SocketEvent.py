from inspect import iscoroutinefunction, signature
from types import AsyncGeneratorType
from typing import Any, Callable, Coroutine, Self
from ..filter import RoleFilter
from ..security import Role
from .Exception import SocketEventException, SocketManagerScopeException, SocketStatusCodeException
from .SocketManagerScope import SocketManagerScope, TGenerator
from .SocketRequest import SocketRequest
from .SocketResponse import SocketResponse
from .SocketResponseCode import SocketResponseCode


TEvent = Callable[..., SocketResponse | None | Coroutine[Any, Any, SocketResponse | None]]
TCachedScopes = dict[str, (Any, type)]
_TScopes = dict[str, Any]


class SocketEvent:
    """Socket event class."""

    name: str

    def __init__(self, event_name: str, event: TEvent):
        self.name = event_name
        self._event = event
        self._event_details = {
            "event": event_name,
            "func": event.__name__,
        }

    async def init(self) -> "Self":
        params = signature(self._event).parameters
        self._scope_creators: dict[str, SocketManagerScope] = {}
        self._generators: list[tuple[bool, TGenerator]] = []
        for scope_name in params:
            self._scope_creators[scope_name] = await SocketManagerScope(
                self._generators, scope_name, params[scope_name], self._event_details
            ).init()
        return self

    async def run(
        self, cached_scopes: TCachedScopes, req: SocketRequest
    ) -> SocketResponse | SocketManagerScopeException | SocketStatusCodeException | SocketEventException | None:
        """Runs the socket event.

        :param cached_scopes: The cached scopes.
        :param req: The socket request.
        """

        if RoleFilter.exists(self._event):
            model_class, actions, role_finder = RoleFilter.get_filtered(self._event)
            role = Role(model_class)

            params = {}
            topics = req.socket.get_topics()
            for topic in topics:
                if ":" in topic:
                    key, value = topic.split(":", 1)
                    params[f"{key}_id"] = value

            is_authorized = await role.is_authorized(req.from_app["auth_user_id"], params, actions, role_finder, False)
            if not is_authorized:
                return SocketStatusCodeException(code=SocketResponseCode.WS_3003_FORBIDDEN, message="Forbidden")

        try:
            scopes = await self._create_scopes(cached_scopes, req)

            if isinstance(scopes, Exception):
                raise scopes

            data = {}
            for scope_name, result in scopes.items():
                data[scope_name] = result

            if iscoroutinefunction(self._event):
                response = await self._event(**data)
            else:
                response = self._event(**data)

            if isinstance(response, SocketResponse):
                return response
            else:
                return None
        except SocketManagerScopeException as e:
            return e
        except Exception as e:
            return SocketEventException(exception=e, **self._event_details)

    async def finish_generators(self, finish_cached_scopes: bool | None = None):
        for cached, generator in self._generators:
            if finish_cached_scopes is None:
                await self._finish_generator(generator)
                continue

            if cached == finish_cached_scopes:
                await self._finish_generator(generator)

    async def _create_scopes(self, cached_scopes: TCachedScopes, req: SocketRequest) -> _TScopes | Exception:
        scopes: _TScopes = {}
        for scope_name in self._scope_creators:
            scope_creator = self._scope_creators[scope_name]

            if scope_name in cached_scopes:
                result, annotation = cached_scopes[scope_name]
                if scope_creator.annotation == annotation:
                    scopes[scope_name] = result
                    continue

            scope = await scope_creator(req)

            if isinstance(scope, Exception):
                await self.finish_generators()
                return scope

            if scope_creator.use_cache:
                cached_scopes[scope_name] = (scope, scope_creator.annotation)
            scopes[scope_name] = scope

        await self.finish_generators(finish_cached_scopes=False)
        return scopes

    async def _finish_generator(self, scope: TGenerator | None):
        if not scope:
            return

        if isinstance(scope, AsyncGeneratorType):
            async for _ in scope:
                pass
        else:
            for _ in scope:
                pass
