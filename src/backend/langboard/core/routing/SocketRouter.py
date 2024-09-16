from inspect import signature
from typing import Any, Callable
from routes import Mapper
from ..utils.decorators import thread_safe_singleton
from .SocketDefaultEvent import SocketDefaultEvent
from .SocketRouterScope import SocketRouterScope, TScopeCreator


TEvent = Callable[..., None]
TRouteEvents = tuple[TEvent, dict[str, TScopeCreator]]
TRoutes = dict[str, list[TRouteEvents]]


@thread_safe_singleton
class SocketRouter:
    """Manages the socket routes and events."""

    def __init__(self):
        self._mapper = Mapper()
        self._routes: dict[str, TRoutes] = {}
        self.use_path("/")

    def use_path(self, path: str):
        """Uses to set the current path for the socket routes.

        E.g.::

            from ...core.routing import AppRouter, SocketDefaultEvent

            AppRouter.socket.use_path("/chat")

            @AppRouter.socket.on(SocketDefaultEvent.OPEN)
            def open(req: SocketRequest):
                ...

        :param path: The path to set.
        """
        self._path = path
        self._mapper.connect(path, route=path)
        self._routes[path] = {}

    def on(self, event: SocketDefaultEvent | str):
        """Registers a socket event for the current path.

        E.g.::

                from ...core.routing import AppRouter, SocketDefaultEvent

                @AppRouter.socket.on(SocketDefaultEvent.OPEN)
                def open(req: SocketRequest):
                    ...

        :param event: The event to register.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event
        _path = self._path

        if _event not in self._routes[self._path]:
            self._routes[self._path][_event] = []

        def decorator(func: TEvent):
            params = signature(func).parameters
            param_creators: dict[str, TScopeCreator] = {}
            event_detail = f"\tRoute: {_path}\n\tEvent: {_event}\n\tFunction: {func.__name__}\n"
            for param_name in params:
                param_creators[param_name] = SocketRouterScope(event_detail, param_name, params[param_name])
            self._routes[self._path][_event].append((func, param_creators))
            return func

        return decorator

    def get_route(self, path: str) -> tuple[TRoutes, dict] | tuple[None, None]:
        """Gets the route and route data for the given path.

        :param path: The path to get the route and route data for.
        """
        route = self._mapper.match(path)
        if not route or not isinstance(route, dict) or "route" not in route:
            return None, None

        return self._routes[route["route"]], route

    def get_events(self, path: str, event: SocketDefaultEvent | str) -> list[TRouteEvents]:
        """Gets the events for the given path and event.

        :param path: The path to get the events for.
        :param event: The event to get the events for.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event

        if path in self._routes:
            return self._routes[path].get(_event, [])

        route, _ = self.get_route(path)
        if not route:
            return []

        return route.get(_event, [])

    def is_valid_user_data(self, user_data: Any | None) -> bool:
        """Checks if the given user data is valid.

        :param user_data: The user data to check.
        """
        return (
            user_data
            and isinstance(user_data, dict)
            and "path" in user_data
            and isinstance(user_data["path"], str)
            and "route_data" in user_data
            and isinstance(user_data["route_data"], dict)
            and "route_path" in user_data
            and isinstance(user_data["route_path"], str)
        )
