from inspect import iscoroutinefunction, signature
from types import AsyncGeneratorType, GeneratorType
from typing import Any, Callable
from .SocketRequest import SocketRequest
from .SocketResponse import SocketResponse
from .SocketRouterScope import SocketRouterScope


TEvent = Callable[..., SocketResponse | None]
TGenerator = GeneratorType | AsyncGeneratorType
TCachedScopes = dict[str, (TGenerator | None, Any, type)]
_TScopes = dict[str, (TGenerator | None, Any)]


class SocketEvent:
    name: str

    def __init__(self, route_path: str, event_name: str, event: TEvent):
        self.name = event_name
        self._event = event
        params = signature(self._event).parameters
        self._scope_creators: dict[str, SocketRouterScope] = {}
        event_detail = f"\tRoute: {route_path}\n\tEvent: {event_name}\n\tFunction: {event.__name__}\n"
        for scope_name in params:
            self._scope_creators[scope_name] = SocketRouterScope(event_detail, scope_name, params[scope_name])

    async def run(self, cached_scopes: TCachedScopes, req: SocketRequest) -> SocketResponse | Exception:
        scopes = await self._create_scopes(cached_scopes, req)
        if isinstance(scopes, Exception):
            return scopes

        try:
            data = {}
            for scope_name, (_, result) in scopes.items():
                data[scope_name] = result

            if iscoroutinefunction(self._event):
                response = await self._event(**data)
            else:
                response = self._event(**data)

            if isinstance(response, SocketResponse):
                return response
        except Exception as e:
            return e

    async def _create_scopes(self, cached_scopes: TCachedScopes, req: SocketRequest) -> _TScopes | Exception:
        scopes: _TScopes = {}
        for scope_name in self._scope_creators:
            scope_creator = self._scope_creators[scope_name]

            if scope_name in cached_scopes:
                _, result, annotation = cached_scopes[scope_name]
                if scope_creator.annotation == annotation:
                    scopes[scope_name] = (None, result)
                    continue

            scope = scope_creator(req)

            if isinstance(scope, Exception):
                await self._finish_generators(scopes)
                return scope

            if scope_creator.use_cache:
                if isinstance(scope, AsyncGeneratorType):
                    result = await scope.__anext__()
                    cached_scopes[scope_name] = (scope, result, type(result))
                    scopes[scope_name] = (None, result)
                elif isinstance(scope, GeneratorType):
                    result = scope.__next__()
                    cached_scopes[scope_name] = (scope, result, type(result))
                    scopes[scope_name] = (None, result)
                else:
                    cached_scopes[scope_name] = (None, scope, scope_creator.annotation)
                    scopes[scope_name] = (None, scope)
            else:
                if isinstance(scope, AsyncGeneratorType):
                    scopes[scope_name] = (scope, await scope.__anext__())
                elif isinstance(scope, GeneratorType):
                    scopes[scope_name] = (scope, scope.__next__())
                else:
                    scopes[scope_name] = (None, scope)

        await self._finish_generators(scopes)
        return scopes

    async def _finish_generators(self, scopes: _TScopes):
        for generator, _ in scopes.values():
            await self._finish_generator(generator)

    async def _finish_generator(self, scope: GeneratorType | AsyncGeneratorType | None):
        if not scope:
            return

        if isinstance(scope, AsyncGeneratorType):
            async for _ in scope:
                pass
        else:
            for _ in scope:
                pass
