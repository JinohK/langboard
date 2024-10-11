from abc import ABC
from typing import cast
from langboard.core.bootstrap import SocketApp
from langboard.core.routing import AppRouter, SocketDefaultEvent, SocketResponse
from langboard.core.security import Auth
from langboard.models import User
from routes import Mapper
from ....helpers.fixtures import ServerFixture


class SocketAppFixture(ABC, ServerFixture):
    _path = "/test_socket_app/1"
    _fake_user = User(id=1, name="test", email="test@test.com", password="test", industry="test", purpose="test")  # type: ignore
    _user_data = {
        "path": _path,
        "route_path": "/test_socket_app/{id}",
        "route_data": {"id": "1"},
        "auth_user_id": _fake_user.id,
        "auth_token": Auth.authenticate(cast(int, _fake_user.id))[0],
    }
    _event_normal = "test_event"
    _event_exception = "test_exception"
    _event_response = "test_response"
    _topic = "test_topic"
    _response = SocketResponse(event=_event_response, data={"test": "test"})

    _socket_app = SocketApp()

    @classmethod
    def setup_class(cls):
        AppRouter.socket.use_path("/test_socket_app/{id}")

        @AppRouter.socket.on(SocketDefaultEvent.Open)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == cls._user_data["route_data"]

        @AppRouter.socket.on(cls._event_normal)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == cls._user_data["route_data"]

        @AppRouter.socket.on(cls._event_exception)
        def _(id: int, route_data: dict, any_data: int):
            assert id == 1
            assert route_data == cls._user_data["route_data"]
            assert isinstance(any_data, int)
            raise Exception("Test exception")

        @AppRouter.socket.on(cls._event_response)
        def _(id: int, route_data: dict) -> SocketResponse:
            assert id == 1
            assert route_data == cls._user_data["route_data"]
            return cls._response

        @AppRouter.socket.on(SocketDefaultEvent.Close)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == cls._user_data["route_data"]

        @AppRouter.socket.on(SocketDefaultEvent.Drain)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == cls._user_data["route_data"]

        @AppRouter.socket.on(SocketDefaultEvent.Subscription)
        def _(id: int, route_data: dict, topic: str):
            assert id == 1
            assert route_data == cls._user_data["route_data"]
            assert topic == cls._topic

    @classmethod
    def teardown_class(cls):
        AppRouter.socket._mapper = Mapper()
        AppRouter.socket._routes = {}
        AppRouter.socket.use_path("/")
