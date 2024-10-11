from inspect import signature
from typing import Any
from langboard.core.routing import SocketDefaultEvent, SocketRouter
from langboard.core.routing.SocketEvent import TEvent
from pytest import raises
from routes import Mapper
from routes.route import Route


class TestSocketRouter:
    TESTABLE_EVENTS: list[SocketDefaultEvent | str] = [
        SocketDefaultEvent.Open,
        SocketDefaultEvent.Close,
        "custom_event",
        "another_event",
        SocketDefaultEvent.Drain,
        SocketDefaultEvent.Subscription,
    ]

    def test_initialization(self):
        router_default_path = SocketRouter()
        router_another_path = SocketRouter("/chat")

        self._test_routes_mapper(router_default_path._mapper, 1, ["/"])
        self._test_routes_mapper(router_another_path._mapper, 1, ["/chat"])
        assert router_default_path._routes == {"/": {}}
        assert router_another_path._routes == {"/chat": {}}
        assert router_default_path._path == "/"
        assert router_another_path._path == "/chat"

    def test_use_path(self):
        router = SocketRouter()
        router.use_path("/chat")
        router.use_path("/test")
        router.use_path("/")

        self._test_routes_mapper(router._mapper, 3, ["/", "/chat", "/test"])
        assert router._routes == {"/": {}, "/chat": {}, "/test": {}}
        assert router._path == "/"

    def test_on(self):
        router = SocketRouter()

        for event in TestSocketRouter.TESTABLE_EVENTS:
            decorator = router.on(event)

            @decorator
            def event_func():
                pass

            sig = signature(decorator)
            params = sig.parameters

            assert len(params) == 1
            assert "func" in params
            assert params["func"].annotation is TEvent

            event_name = event.value if isinstance(event, SocketDefaultEvent) else event

            assert event_name in router._routes[router._path]
            assert len(router._routes[router._path][event_name]) == 1

            router_event = router._routes[router._path][event_name][0]

            assert router_event.name == event_name
            assert router_event._event == event_func

    def test_get_route(self):
        router = SocketRouter()
        path_data: list[tuple[str, str, str | None, str | None]] = [
            ("/", "/", None, None),
            ("/{room}", "/aa", "room", "aa"),
            ("/test/:user", "/test/1", "user", "1"),
        ]

        for path, test_path, reg_name, reg_expected in path_data:
            route, route_data = router.get_route(test_path)

            if path != "/":
                assert route is None
                assert route_data is None

            router.use_path(path)

            route, route_data = router.get_route(test_path)

            assert route == router._routes[path]
            assert "route" in route_data  # type: ignore
            assert route_data["route"] == path  # type: ignore

            if reg_name is not None:
                assert reg_name in route_data  # type: ignore
                assert route_data[reg_name] == reg_expected  # type: ignore

    def test_get_events(self):
        router = SocketRouter()
        paths = ["/", "/{room}", "/test/:user"]

        for path in paths:
            router.use_path(path)

            for event in TestSocketRouter.TESTABLE_EVENTS:
                router.on(event)(lambda: None)

        test_paths = ["/", "/aa", "/test/:user"]

        for test_path in test_paths:
            for event in TestSocketRouter.TESTABLE_EVENTS:
                event_name = event.value if isinstance(event, SocketDefaultEvent) else event
                events = router.get_events(test_path, event)

                assert len(events) == 1
                assert events[0].name == event_name

        not_found_events = router.get_events("/chat/1", "not_found_event")

        assert len(not_found_events) == 0

    def test_throw_socket_router_exception_when_merging_router_with_conflicting_path_regexp(self):
        router = SocketRouter()
        router.use_path("/{room}")

        router2 = SocketRouter()
        router2.use_path("/{room_conflict}")

        with raises(RuntimeError) as e:
            router.merge(router2)

        expected_messages = [
            "Failed to merge the router with the path '/{room_conflict}' due to the route keys not matching.",
            "Target route path: /{room}",
            "Target route keys: {'room'}",
            "Route path to merge: /{room_conflict}",
            "Route keys to merge: {'room_conflict'}",
        ]

        expected_message = "\n\t".join(expected_messages)

        assert str(e.value) == expected_message

    def test_merge(self):
        paths = ["/", "/{room}", "/test/:user", "/bb/bb"]

        routers: list[SocketRouter] = []

        for path in paths:
            router = SocketRouter(path)

            for event in TestSocketRouter.TESTABLE_EVENTS:
                router.on(event)(lambda: None)

            routers.append(router)

        existed_path = routers[-1]._path
        existed_events = [
            event for event in TestSocketRouter.TESTABLE_EVENTS if not isinstance(event, SocketDefaultEvent)
        ]

        main_router = routers[0]

        main_router.use_path(existed_path)
        for event in existed_events:
            main_router.on(event)(lambda: None)

        for router in routers[1:]:
            main_router.merge(router)

            assert not hasattr(router, "_path")
            assert not hasattr(router, "_mapper")
            assert not hasattr(router, "_routes")

        for path in paths:
            assert path in main_router._routes

            events = main_router._routes[path]
            for event_name in TestSocketRouter.TESTABLE_EVENTS:
                event_name = event_name.value if isinstance(event_name, SocketDefaultEvent) else event_name

                if path == existed_path and event_name in existed_events:
                    assert len(events[event_name]) == 2
                else:
                    assert len(events[event_name]) == 1

    def _test_routes_mapper(self, mapper: Any, count: int, paths: list[str]):
        assert isinstance(mapper, Mapper)
        assert len(mapper.matchlist) == count

        for route in mapper.matchlist:
            assert isinstance(route, Route)
            assert route.routepath in paths
