from typing import AsyncGenerator, Generator
from fastapi import Depends
from langboard.core.routing import (
    SocketDefaultEvent,
    SocketEvent,
    SocketRequest,
    SocketResponse,
    TCachedScopes,
    WebSocket,
)
from langboard.core.routing.Exception import SocketEventException, SocketManagerScopeException
from langboard.core.utils.String import concat
from pytest import mark
from ....helpers.fixtures import ServerFixture
from ....helpers.mocks import MockSocketifyWebSocket


class TestSocketEvent(ServerFixture):
    def test_initialization(self):
        def route_event(scope: str) -> None:
            print(scope)

        event = SocketEvent("/", SocketDefaultEvent.Open.value, route_event)

        assert event.name == SocketDefaultEvent.Open.value
        assert event._event == route_event
        assert event._event_details == {
            "route": "/",
            "event": SocketDefaultEvent.Open.value,
            "func": "route_event",
        }
        assert len(event._scope_creators) == 1
        assert "scope" in event._scope_creators

    @mark.asyncio
    async def test_run_with_scope_exception(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        async def route_event_async(scope: int) -> None:
            print(scope)

        def route_event_sync(scope: int) -> None:
            print(scope)

        socket = WebSocket(_mock_socketify_websocket)

        data = {"scope": "test"}
        req = SocketRequest(socket, {}, data)

        events = [
            SocketEvent("/", SocketDefaultEvent.Open.value, route_event_async),
            SocketEvent("/", SocketDefaultEvent.Open.value, route_event_sync),
        ]

        for event in events:
            result = await event.run({}, req)

            assert isinstance(result, SocketManagerScopeException)
            assert result._route == "/"
            assert result._event == SocketDefaultEvent.Open.value
            assert result._func == "route_event_async" or result._func == "route_event_sync"
            assert result._param == "scope"
            assert isinstance(result.raw_exception, ValueError)
            assert str(result.raw_exception) == f"invalid literal for int() with base 10: '{data['scope']}'"

    @mark.asyncio
    async def test_run_with_event_exception(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        async def route_event_async(scope: int) -> None:
            raise ValueError(scope)

        def route_event_sync(scope: int) -> None:
            raise ValueError(scope)

        socket = WebSocket(_mock_socketify_websocket)
        data = {"scope": 1}
        req = SocketRequest(socket, {}, data)

        events = [
            SocketEvent("/", SocketDefaultEvent.Open.value, route_event_async),
            SocketEvent("/", SocketDefaultEvent.Open.value, route_event_sync),
        ]

        for event in events:
            result = await event.run({}, req)

            assert isinstance(result, SocketEventException)
            assert result._route == "/"
            assert result._event == SocketDefaultEvent.Open.value
            assert result._func == "route_event_async" or result._func == "route_event_sync"
            assert isinstance(result.raw_exception, ValueError)
            assert str(result.raw_exception) == str(data["scope"])

            messages = [
                f"Route: {result._route}",
                f"Event: {result._event}",
                f"Function: {result._func}",
                f"Exception:\n{result._formatted_exception}",
            ]

            expected_message = concat("\t", "\n\t".join(messages), "\n")

            assert str(result) == expected_message

    @mark.asyncio
    async def test_run_with_cached_scopes(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        async def depends_func_async():
            yield 1
            yield 2  # this will not be passed to the event

        def depends_func_sync():
            yield 2
            yield 3  # this will not be passed to the event

        def not_generator():
            return 3

        async def route_event_async(
            scope_generator_async: int = Depends(depends_func_async),
            scope_generator_sync: int = Depends(depends_func_sync),
            scope_not_generator: int = Depends(not_generator),
            not_cached_scope_generator_async: int = Depends(depends_func_async, use_cache=False),
            not_cached_scope_generator_sync: int = Depends(depends_func_sync, use_cache=False),
            not_cached_scope_not_generator: int = Depends(not_generator, use_cache=False),
        ) -> None:
            print(
                scope_generator_async,
                scope_generator_sync,
                scope_not_generator,
                not_cached_scope_generator_async,
                not_cached_scope_generator_sync,
                not_cached_scope_not_generator,
            )

        def route_event_sync(
            scope_generator_async: int = Depends(depends_func_async),
            scope_generator_sync: int = Depends(depends_func_sync),
            scope_not_generator: int = Depends(not_generator),
            not_cached_scope_generator_async: int = Depends(depends_func_async, use_cache=False),
            not_cached_scope_generator_sync: int = Depends(depends_func_sync, use_cache=False),
            not_cached_scope_not_generator: int = Depends(not_generator, use_cache=False),
        ) -> None:
            print(
                scope_generator_async,
                scope_generator_sync,
                scope_not_generator,
                not_cached_scope_generator_async,
                not_cached_scope_generator_sync,
                not_cached_scope_not_generator,
            )

        cached_scopes: TCachedScopes = {}
        socket = WebSocket(_mock_socketify_websocket)
        req = SocketRequest(socket, {}, {})

        events = [
            SocketEvent("/", "test_event", route_event_async),
            SocketEvent("/", "test_event", route_event_sync),
            SocketEvent("/", "test_event", route_event_async),  # for testing cached scopes
            SocketEvent("/", "test_event", route_event_sync),  # for testing cached scopes
        ]

        expected: list[tuple[str, AsyncGenerator | Generator | None, int]] = [
            ("scope_generator_async", AsyncGenerator, 1),
            ("scope_generator_sync", Generator, 2),
            ("scope_not_generator", None, 3),
        ]  # type: ignore

        not_cached_scope_names = [
            "not_cached_scope_generator_async",
            "not_cached_scope_generator_sync",
            "not_cached_scope_not_generator",
        ]

        for event in events:
            # The first event will initialize the cached scopes
            # All the next events will use the cached scopes
            await event.run(cached_scopes, req)

            for name, annotation, value in expected:
                assert name in cached_scopes
                if annotation is None:
                    assert cached_scopes[name][0] is None
                else:
                    assert isinstance(cached_scopes[name][0], annotation)  # type: ignore
                assert cached_scopes[name][1] == value
                assert cached_scopes[name][2] is int

            for name in not_cached_scope_names:
                assert name not in cached_scopes

    @mark.asyncio
    async def test_run_with_response(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        async def route_event_async(scope: int) -> SocketResponse:
            return SocketResponse(event="test_response_event", data={"scope": scope})

        def route_event_sync(scope: int) -> SocketResponse:
            return SocketResponse(event="test_response_event", data={"scope": scope})

        socket = WebSocket(_mock_socketify_websocket)
        req = SocketRequest(socket, {}, {"scope": 1})

        events = [
            SocketEvent("/", "test_event", route_event_async),
            SocketEvent("/", "test_event", route_event_sync),
        ]

        for event in events:
            result = await event.run({}, req)

            assert isinstance(result, SocketResponse)
            assert result.event == "test_response_event"
            assert result.data == {"scope": 1}
