from inspect import iscoroutinefunction, signature
from types import AsyncGeneratorType, GeneratorType
from typing import Any, Callable, Coroutine
from .Exception import SocketEventException, SocketRouterScopeException
from .SocketRequest import SocketRequest
from .SocketResponse import SocketResponse
from .SocketRouterScope import SocketRouterScope


TEvent = Callable[..., SocketResponse | None | Coroutine[Any, Any, SocketResponse | None]]
TGenerator = GeneratorType | AsyncGeneratorType
TCachedScopes = dict[str, (TGenerator | None, Any, type)]
_TScopes = dict[str, (TGenerator | None, Any)]


class SocketEvent:
    """Socket event class."""

    name: str

    def __init__(self, route_path: str, event_name: str, event: TEvent):
        self.name = event_name
        self._event = event
        params = signature(self._event).parameters
        self._event_details = {
            "route": route_path,
            "event": event_name,
            "func": event.__name__,
        }
        self._scope_creators: dict[str, SocketRouterScope] = {}
        for scope_name in params:
            self._scope_creators[scope_name] = SocketRouterScope(scope_name, params[scope_name], self._event_details)

    async def run(
        self, cached_scopes: TCachedScopes, req: SocketRequest
    ) -> SocketResponse | SocketRouterScopeException | SocketEventException | None:
        """Runs the socket event.

        :param cached_scopes: The cached scopes.
        :param req: The socket request.
        """
        try:
            scopes = await self._create_scopes(cached_scopes, req)

            if isinstance(scopes, Exception):
                raise scopes

            data = {}
            for scope_name, (_, result) in scopes.items():
                data[scope_name] = result

            if iscoroutinefunction(self._event):
                response = await self._event(**data)
            else:
                response = self._event(**data)

            if isinstance(response, SocketResponse):
                return response
            else:
                return None
        except SocketRouterScopeException as e:
            return e
        except Exception as e:
            return SocketEventException(exception=e, **self._event_details)

    async def _create_scopes(self, cached_scopes: TCachedScopes, req: SocketRequest) -> _TScopes | Exception:
        scopes: _TScopes = {}
        for scope_name in self._scope_creators:
            scope_creator = self._scope_creators[scope_name]

            if scope_name in cached_scopes:
                _, result, annotation = cached_scopes[scope_name]
                if scope_creator.annotation == annotation:
                    scopes[scope_name] = (None, result)  # type: ignore
                    continue

            scope = scope_creator(req)

            if isinstance(scope, Exception):
                await self._finish_generators(scopes)
                return scope

            if scope_creator.use_cache:
                if isinstance(scope, AsyncGeneratorType):
                    result = await anext(scope)
                    cached_scopes[scope_name] = (scope, result, type(result))  # type: ignore
                    scopes[scope_name] = (None, result)  # type: ignore
                elif isinstance(scope, GeneratorType):
                    result = next(scope)
                    cached_scopes[scope_name] = (scope, result, type(result))  # type: ignore
                    scopes[scope_name] = (None, result)  # type: ignore
                else:
                    cached_scopes[scope_name] = (None, scope, scope_creator.annotation)  # type: ignore
                    scopes[scope_name] = (None, scope)  # type: ignore
            else:
                if isinstance(scope, AsyncGeneratorType):
                    scopes[scope_name] = (scope, await anext(scope))  # type: ignore
                elif isinstance(scope, GeneratorType):
                    scopes[scope_name] = (scope, next(scope))  # type: ignore
                else:
                    scopes[scope_name] = (None, scope)  # type: ignore

        await self._finish_generators(scopes)
        return scopes

    async def _finish_generators(self, scopes: _TScopes):
        for generator, _ in scopes.values():
            await self._finish_generator(generator)  # type: ignore

    async def _finish_generator(self, scope: GeneratorType | AsyncGeneratorType | None):
        if not scope:
            return

        if isinstance(scope, AsyncGeneratorType):
            await scope.aclose()
        else:
            scope.close()
