from abc import ABC
from langboard.core.bootstrap import SocketApp
from langboard.core.routing import AppRouter, SocketDefaultEvent, SocketResponse
from langboard.core.security import Auth
from langboard.models import User
from routes import Mapper
from ....helpers.fixtures import ServerFixture


class SocketAppFixture(ABC, ServerFixture):
    @classmethod
    def setup_class(self):
        self._path = "/test_socket_app/1"
        self._fake_user = User(
            id=1, name="test", email="test@test.com", password="test", industry="test", purpose="test"
        )
        self._user_data = {
            "path": self._path,
            "route_path": "/test_socket_app/{id}",
            "route_data": {"id": "1"},
            "auth_user_id": self._fake_user.id,
            "auth_token": Auth.authenticate(self._fake_user.id)[0],
        }
        self._event_normal = "test_event"
        self._event_exception = "test_exception"
        self._event_response = "test_response"
        self._topic = "test_topic"
        self._response = SocketResponse(event=self._event_response, data={"test": "test"})

        self._socket_app = SocketApp()
        AppRouter.socket.use_path("/test_socket_app/{id}")

        @AppRouter.socket.on(SocketDefaultEvent.Open)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == self._user_data["route_data"]

        @AppRouter.socket.on(self._event_normal)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == self._user_data["route_data"]

        @AppRouter.socket.on(self._event_exception)
        def _(id: int, route_data: dict, any_data: int):
            assert id == 1
            assert route_data == self._user_data["route_data"]
            assert isinstance(any_data, int)
            raise Exception("Test exception")

        @AppRouter.socket.on(self._event_response)
        def _(id: int, route_data: dict) -> SocketResponse:
            assert id == 1
            assert route_data == self._user_data["route_data"]
            return self._response

        @AppRouter.socket.on(SocketDefaultEvent.Close)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == self._user_data["route_data"]

        @AppRouter.socket.on(SocketDefaultEvent.Drain)
        def _(id: int, route_data: dict):
            assert id == 1
            assert route_data == self._user_data["route_data"]

        @AppRouter.socket.on(SocketDefaultEvent.Subscription)
        def _(id: int, route_data: dict, topic: str):
            assert id == 1
            assert route_data == self._user_data["route_data"]
            assert topic == self._topic

    @classmethod
    def teardown_class(self):
        del self._user_data

        AppRouter.socket._mapper = Mapper()
        AppRouter.socket._routes = {}
        AppRouter.socket.use_path("/")
