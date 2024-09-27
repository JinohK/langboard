from json import dumps as json_dumps
from typing import Awaitable, Callable
from unittest.mock import MagicMock, patch
from langboard.core.bootstrap import SocketApp
from langboard.core.routing import SocketResponseCode
from pytest import mark
from socketify import OpCode
from ....helpers.mocks import MockSocketifyRequest, MockSocketifyResponse, MockSocketifyWebSocket
from ....helpers.testing import ThreadSafety
from .SocketAppFixture import SocketAppFixture


class TestSocketApp(SocketAppFixture, ThreadSafety):
    def test_initialization(self):
        assert isinstance(self._socket_app, dict), "SocketApp is not a subclass of dict"
        assert (
            "upgrade" in self._socket_app and self._socket_app["upgrade"] == self._socket_app.on_upgrade
        ), "SocketApp['upgrade'] method not set"
        assert (
            "open" in self._socket_app and self._socket_app["open"] == self._socket_app.on_open
        ), "SocketApp['open'] method not set"
        assert (
            "message" in self._socket_app and self._socket_app["message"] == self._socket_app.on_message
        ), "SocketApp['message'] method not set"
        assert (
            "close" in self._socket_app and self._socket_app["close"] == self._socket_app.on_close
        ), "SocketApp['close'] method not set"
        assert (
            "subscription" in self._socket_app and self._socket_app["subscription"] == self._socket_app.on_subscription
        ), "SocketApp['subscription'] method not set"

    def test_thread_safety(self):
        self.assert_thread_safety(cls=SocketApp)

    def test_on_upgrade(
        self, _mock_request: MockSocketifyRequest, _mock_response: MockSocketifyResponse, _mock_context: MagicMock
    ):
        headers = {
            "sec-websocket-key": "test_key",
            "sec-websocket-protocol": "test_protocol",
            "sec-websocket-extensions": "test_extensions",
        }

        _mock_request.get_header.side_effect = lambda key: headers.get(key)

        # Test if the route isn't found
        _mock_request.get_url.return_value = "/test_socket_app"
        self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

        _mock_response.upgrade.assert_not_called()

        # Check if the route is found
        _mock_request.get_url.return_value = self._path
        self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

        _mock_response.upgrade.assert_called_once_with(
            "test_key", "test_protocol", "test_extensions", _mock_context, self._user_data
        )

    @mark.asyncio
    async def test_on_open(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_open(_mock_socketify_websocket)
        )

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        await self._socket_app.on_open(_mock_socketify_websocket)

        assert not _mock_socketify_websocket.end.called, "WebSocket.end called on on_open for valid user data assertion"

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_message_normal(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT)
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        valid_data_str = json_dumps(
            {
                "event": self._event_normal,
            }
        )

        await self._socket_app.on_message(_mock_socketify_websocket, valid_data_str, OpCode.TEXT)

        assert not _mock_socketify_websocket.end.called, "WebSocket.end called on on_message for valid data assertion"
        assert not _mock_socketify_websocket.send.called, "WebSocket.send called on on_message for valid data assertion"

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_message_exception(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT)
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        with patch("langboard.core.routing.WebSocket.WebSocket.send") as mock_send:
            # if the exception is raised from the event
            valid_data = {
                "event": self._event_exception,
                "any_data": 1,
            }

            await self._socket_app.on_message(_mock_socketify_websocket, json_dumps(valid_data), OpCode.TEXT)

            assert (
                mock_send.called
            ), "WebSocket.send not called on on_message for valid data assertion for event exception"
            mock_send.assert_called_once_with(
                event="error", data={"message": "Test exception", "code": SocketResponseCode.ServerError.value}
            )

            mock_send.reset_mock()

            # if the exception is raised from the scope
            valid_data["any_data"] = "test"

            await self._socket_app.on_message(_mock_socketify_websocket, json_dumps(valid_data), OpCode.TEXT)

            assert (
                mock_send.called
            ), "WebSocket.send not called on on_message for valid data assertion for scope exception"
            mock_send.assert_called_once_with(
                event="error",
                data={
                    "message": "invalid literal for int() with base 10: 'test'",
                    "code": SocketResponseCode.InvalidData.value,
                },
            )

            mock_send.reset_mock()

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_message_response(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT)
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        valid_data_str = json_dumps(
            {
                "event": self._event_response,
            }
        )

        with patch("langboard.core.routing.WebSocket.WebSocket.send") as mock_send:
            await self._socket_app.on_message(_mock_socketify_websocket, valid_data_str, OpCode.TEXT)

            assert mock_send.called, "WebSocket.send not called on on_message for valid data assertion"
            mock_send.assert_called_once_with(response=self._response)

            mock_send.reset_mock()

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_close(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_close(_mock_socketify_websocket, 1000, "")
        )

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        await self._socket_app.on_close(_mock_socketify_websocket, 1000, "")

        assert (
            not _mock_socketify_websocket.end.called
        ), "WebSocket.end called on on_close for valid user data assertion"

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_drain(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_drain(_mock_socketify_websocket)
        )

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        await self._socket_app.on_drain(_mock_socketify_websocket)

        assert (
            not _mock_socketify_websocket.end.called
        ), "WebSocket.end called on on_drain for valid user data assertion"

        _mock_socketify_websocket.reset_all()

    @mark.asyncio
    async def test_on_subscription(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, lambda: self._socket_app.on_subscription(_mock_socketify_websocket, self._topic)
        )

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data

        await self._socket_app.on_subscription(_mock_socketify_websocket, self._topic)

        assert (
            not _mock_socketify_websocket.end.called
        ), "WebSocket.end called on on_subscription for valid user data assertion"

        _mock_socketify_websocket.reset_all()

    @classmethod
    async def _assert_invalid_connection(self, socket: MockSocketifyWebSocket, callback: Callable[[], Awaitable]):
        invalid_user_data = [
            None,
            {},
            {"path": 1},
            {"path": self._path},
            {"path": self._path, "route_data": 1},
            {"path": self._path, "route_data": {}},
            {"path": self._path, "route_data": {}, "route_path": 1},
        ]

        for user_data in invalid_user_data:
            socket.get_user_data.return_value = user_data

            assert (
                not socket.get_user_data.called
            ), f"WebSocket.get_user_data called on {callback.__name__} for invalid assertion"
            assert not socket.end.called, f"WebSocket.end called on {callback.__name__} for invalid assertion"

            await callback()

            assert (
                socket.get_user_data.called
            ), f"WebSocket.get_user_data not called on {callback.__name__} for invalid assertion"
            socket.end.assert_called_with(
                SocketResponseCode.InvalidConnection,
                {"message": "Invalid connection", "code": SocketResponseCode.InvalidConnection.value},
            )

            socket.get_user_data.reset_mock()
            socket.end.reset_mock()

    @classmethod
    async def _assert_invalid_data(self, socket: MockSocketifyWebSocket):
        socket.get_user_data.return_value = self._user_data

        invalid_data_strs = [
            None,
            1,
            "{}",
            '{"event": 1}',
        ]

        for data_str in invalid_data_strs:
            await self._socket_app.on_message(socket, data_str, OpCode.TEXT)

            assert socket.send.called, "WebSocket.send not called on on_message for invalid data assertion"
            socket.send.assert_called_once_with(
                {"event": "error", "data": {"message": "Invalid data", "code": SocketResponseCode.InvalidData.value}}
            )

            socket.send.reset_mock()
