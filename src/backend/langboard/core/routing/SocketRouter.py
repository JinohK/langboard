from typing import Any
from routes import Mapper
from .SocketDefaultEvent import SocketDefaultEvent
from .SocketEvent import SocketEvent, TEvent


TRoutes = dict[str, list[SocketEvent]]


class SocketRouter:
    """Manages the socket routes and events.

    E.g.::

        from ...core.routing import AppRouter, SocketDefaultEvent

        @AppRouter.socket.on(SocketDefaultEvent.Open)
        def open(req: SocketRequest):
            ...

    Or you can use it in a different way

    E.g.::

        from ...core.routing import AppRouter, SocketRouter, SocketDefaultEvent

        router = SocketRouter("/chat")

        @router.on(SocketDefaultEvent.Open)
        def open(req: SocketRequest):
            ...

        # This must be called after all the routes are defined.
        AppRouter.socket.merge(router)
        # After this, all the attributes of the router will be destroyed.
    """

    def __init__(self, path: str = "/"):
        self._mapper = Mapper()
        self._routes: dict[str, TRoutes] = {}
        self.use_path(path)

    def use_path(self, path: str):
        """Uses to set the current path for the socket routes.

        E.g.::

            from ...core.routing import AppRouter, SocketDefaultEvent

            AppRouter.socket.use_path("/chat")

            @AppRouter.socket.on(SocketDefaultEvent.Open)
            def open(req: SocketRequest):
                ...

        :param path: The path to set.
        """
        self._path = path
        if path not in self._routes:
            self._mapper.connect(path, route=path)
            self._mapper.create_regs()
            self._routes[path] = {}

    def on(self, event: SocketDefaultEvent | str):
        """Registers a socket event for the current path.

        E.g.::

                from ...core.routing import AppRouter, SocketDefaultEvent

                @AppRouter.socket.on(SocketDefaultEvent.Open)
                def open(req: SocketRequest):
                    ...

        :param event: The event to register.
        """
        _event = event.value if isinstance(event, SocketDefaultEvent) else event
        _path = self._path

        if _event not in self._routes[self._path]:
            self._routes[self._path][_event] = []

        def decorator(func: TEvent):
            socket_event = SocketEvent(_path, _event, func)
            self._routes[self._path][_event].append(socket_event)
            return func

        return decorator

    def get_route(self, path: str) -> tuple[TRoutes, dict] | tuple[None, None]:
        """Gets the route and route data for the given path.

        :param path: The path to get the route and route data for.
        """
        route: dict[str, Any] | None = self._mapper.match(path)
        if not route or not isinstance(route, dict) or "route" not in route:
            return None, None

        return self._routes[route["route"]], route

    def get_events(self, path: str, event: SocketDefaultEvent | str) -> list[SocketEvent]:
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

    def merge(self, router: "SocketRouter") -> None:
        """Merges a router with the current socket router.

        :param router: The router to merge.
        """
        for path, routes in router._routes.items():
            self._check_mergable(router, path)

            if path not in self._routes:
                self._mapper.connect(path, route=path)
                self._routes[path] = routes
                continue

            for event, events in routes.items():
                if event not in self._routes[path]:
                    self._routes[path][event] = events
                    continue

                self._routes[path][event].extend(events)

        del router._path
        del router._mapper

        router._routes.clear()
        del router._routes

    def _check_mergable(self, router: "SocketRouter", path: str) -> None:
        if path == "/" or (":" not in path and "{" not in path and "}" not in path):
            return

        checkable_path = self._create_checkable_path(path)
        route: dict[str, Any] = self._mapper.match(checkable_path) or {}
        sub_route: dict[str, Any] = router._mapper.match(checkable_path) or {}

        if not route or not isinstance(route, dict) or "route" not in route:
            return

        route_keys = set(route.keys())
        sub_route_keys = set(sub_route.keys())

        route_keys.remove("route") if "route" in route_keys else None
        sub_route_keys.remove("route") if "route" in sub_route_keys else None

        if route_keys != sub_route_keys:
            route_path = route["route"]
            messages = [
                f"Failed to merge the router with the path '{path}' due to the route keys not matching.",
                f"Target route path: {route_path}",
                f"Target route keys: {route_keys}",
                f"Route path to merge: {path}",
                f"Route keys to merge: {sub_route_keys}",
            ]

            raise RuntimeError("\n\t".join(messages))

    def _create_checkable_path(self, path: str) -> str:
        return path.replace(":", "_").replace("{", "_").replace("}", "_")
