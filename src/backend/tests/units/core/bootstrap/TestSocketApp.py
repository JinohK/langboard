from json import dumps as json_dumps
from typing import Awaitable, Callable
from unittest.mock import MagicMock, patch
from fastapi import status
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

    @mark.asyncio
    async def test_on_upgrade(
        self, _mock_request: MockSocketifyRequest, _mock_response: MockSocketifyResponse, _mock_context: MagicMock
    ):
        headers = {
            "sec-websocket-key": "test_key",
            "sec-websocket-protocol": "test_protocol",
            "sec-websocket-extensions": "test_extensions",
        }

        _mock_request.get_header.side_effect = lambda key: headers.get(key)

        # Test if get_url returns None
        _mock_request.get_url.return_value = None
        await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

        _mock_response.upgrade.assert_not_called()
        _mock_response.send.assert_called_once_with(status=status.HTTP_404_NOT_FOUND, end_connection=True)

        _mock_response.send.reset_mock()

        # Test if the route isn't found
        _mock_request.get_url.return_value = "/test_socket_app"
        await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

        _mock_response.upgrade.assert_not_called()
        _mock_response.send.assert_called_once_with(status=status.HTTP_404_NOT_FOUND, end_connection=True)

        _mock_response.send.reset_mock()

        # Test if the route is found
        _mock_request.get_url.return_value = self._path

        # Test if get_queries returns None
        _mock_request.get_queries.return_value = None
        await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

        _mock_response.upgrade.assert_not_called()
        _mock_response.send.assert_called_once_with(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)

        _mock_request.get_queries.reset_mock()
        _mock_response.send.reset_mock()

        _mock_request.get_queries.return_value = {}

        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            # Test if the authorization token is invalid
            mock_validate.return_value = status.HTTP_401_UNAUTHORIZED
            await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

            _mock_response.send.assert_called_once_with(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)

            _mock_response.send.reset_mock()

            # Test if the authorization token is expired
            mock_validate.return_value = status.HTTP_422_UNPROCESSABLE_ENTITY
            await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

            _mock_response.send.assert_called_once_with(
                status=status.HTTP_422_UNPROCESSABLE_ENTITY, end_connection=True
            )

            _mock_response.send.reset_mock()

            # Test if the authorization token is valid
            mock_validate.return_value = self._fake_user
            await self._socket_app.on_upgrade(_mock_response, _mock_request, _mock_context)

            user_data = self._user_data.copy()

            user_data["auth_token"] = _mock_request.get_queries().get(
                "Authorization", _mock_request.get_queries().get("authorization", None)
            )

            _mock_response.upgrade.assert_called_once_with(
                "test_key", "test_protocol", "test_extensions", _mock_context, user_data
            )

    @mark.asyncio
    async def test_on_open(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, "on_open", lambda: self._socket_app.on_open(_mock_socketify_websocket)
        )

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket, "on_open", lambda: self._socket_app.on_open(_mock_socketify_websocket)
        )

        # if the user data is valid
        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            await self._socket_app.on_open(_mock_socketify_websocket)

            assert (
                not _mock_socketify_websocket.end.called
            ), "WebSocket.end called on on_open for valid user data assertion"

    @mark.asyncio
    async def test_on_message_normal(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        # if the user data is valid
        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            valid_data_str = json_dumps(
                {
                    "event": self._event_normal,
                }
            )

            await self._socket_app.on_message(_mock_socketify_websocket, valid_data_str, OpCode.TEXT)

            assert (
                not _mock_socketify_websocket.end.called
            ), "WebSocket.end called on on_message for valid data assertion"
            assert (
                not _mock_socketify_websocket.send.called
            ), "WebSocket.send called on on_message for valid data assertion"

    @mark.asyncio
    async def test_on_message_exception(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        # if the user data is valid
        _mock_socketify_websocket.get_user_data.return_value = self._user_data
        with (
            patch("langboard.core.routing.WebSocket.WebSocket.send") as mock_send,
            patch("langboard.core.security.Auth.Auth.validate") as mock_validate,
        ):
            mock_validate.return_value = self._fake_user
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
                event="error",
                data={"message": "Test exception", "code": SocketResponseCode.WS_1011_INTERNAL_ERROR.value},
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
                    "code": SocketResponseCode.WS_4001_INVALID_DATA.value,
                },
            )

    @mark.asyncio
    async def test_on_message_response(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        await self._assert_invalid_data(_mock_socketify_websocket)

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket,
            "on_message",
            lambda: self._socket_app.on_message(_mock_socketify_websocket, "", OpCode.TEXT),
        )

        # if the user data is valid
        with (
            patch("langboard.core.routing.WebSocket.WebSocket.send") as mock_send,
            patch("langboard.core.security.Auth.Auth.validate") as mock_validate,
        ):
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            valid_data_str = json_dumps(
                {
                    "event": self._event_response,
                }
            )

            await self._socket_app.on_message(_mock_socketify_websocket, valid_data_str, OpCode.TEXT)

            assert mock_send.called, "WebSocket.send not called on on_message for valid data assertion"
            mock_send.assert_called_once_with(response=self._response)

    @mark.asyncio
    async def test_on_close(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        _mock_socketify_websocket.reset_all()

        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket,
            "on_close",
            lambda: self._socket_app.on_close(_mock_socketify_websocket, 1000, ""),
        )

        # if the user data is valid
        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            await self._socket_app.on_close(_mock_socketify_websocket, 1000, "")

            assert (
                not _mock_socketify_websocket.end.called
            ), "WebSocket.end called on on_close for valid user data assertion"

    @mark.asyncio
    async def test_on_drain(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket, "on_drain", lambda: self._socket_app.on_drain(_mock_socketify_websocket)
        )

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket, "on_drain", lambda: self._socket_app.on_drain(_mock_socketify_websocket)
        )

        # if the user data is valid
        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            await self._socket_app.on_drain(_mock_socketify_websocket)

            assert (
                not _mock_socketify_websocket.end.called
            ), "WebSocket.end called on on_drain for valid user data assertion"

    @mark.asyncio
    async def test_on_subscription(self, _mock_socketify_websocket: MockSocketifyWebSocket):
        # if the user data is invalid
        await self._assert_invalid_connection(
            _mock_socketify_websocket,
            "on_subscription",
            lambda: self._socket_app.on_subscription(_mock_socketify_websocket, self._topic),
        )

        # if the user data is valid but the token is invalid
        await self._assert_authorization_failures(
            _mock_socketify_websocket,
            "on_subscription",
            lambda: self._socket_app.on_subscription(_mock_socketify_websocket, self._topic),
        )

        # if the user data is valid
        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user
            _mock_socketify_websocket.get_user_data.return_value = self._user_data
            await self._socket_app.on_subscription(_mock_socketify_websocket, self._topic)

            assert (
                not _mock_socketify_websocket.end.called
            ), "WebSocket.end called on on_subscription for valid user data assertion"

    async def _assert_invalid_connection(
        self, socket: MockSocketifyWebSocket, name: str, callback: Callable[[], Awaitable]
    ):
        invalid_user_data = [
            None,
            {},
            {"path": 1},
            {"path": self._path},
            {"path": self._path, "route_data": 1},
            {"path": self._path, "route_data": {}},
            {"path": self._path, "route_data": {}, "route_path": 1},
            {"path": self._path, "route_data": {}, "route_path": "/path", "auth_user_id": "test"},
            {"path": self._path, "route_data": {}, "route_path": "/path", "auth_user_id": 1, "auth_token": 3},
        ]

        for user_data in invalid_user_data:
            socket.reset_all()

            socket.get_user_data.return_value = user_data

            assert not socket.get_user_data.called, f"WebSocket.get_user_data called on {name} for invalid assertion"
            assert not socket.end.called, f"WebSocket.end called on {name} for invalid assertion"

            await callback()

            assert socket.get_user_data.called, f"WebSocket.get_user_data not called on {name} for invalid assertion"
            socket.end.assert_called_with(
                SocketResponseCode.WS_4000_INVALID_CONNECTION.value,
                {"message": "Invalid connection", "code": SocketResponseCode.WS_4000_INVALID_CONNECTION.value},
            )

            socket.reset_all()

    async def _assert_invalid_data(self, socket: MockSocketifyWebSocket):
        invalid_data_strs = [
            None,
            1,
            "{}",
            '{"event": 1}',
        ]

        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            mock_validate.return_value = self._fake_user

            for data_str in invalid_data_strs:
                socket.reset_all()
                socket.get_user_data.return_value = self._user_data
                await self._socket_app.on_message(socket, data_str, OpCode.TEXT)

                assert socket.send.called, "WebSocket.send not called on on_message for invalid data assertion"
                socket.send.assert_called_once_with(
                    {
                        "event": "error",
                        "data": {"message": "Invalid data", "code": SocketResponseCode.WS_4001_INVALID_DATA.value},
                    }
                )

                socket.reset_all()

    async def _assert_authorization_failures(
        self, socket: MockSocketifyWebSocket, name: str, callback: Callable[[], Awaitable]
    ):
        socket.reset_all()

        socket.get_user_data.return_value = self._user_data

        with patch("langboard.core.security.Auth.Auth.validate") as mock_validate:
            # Test if the authorization token is invalid
            mock_validate.return_value = status.HTTP_401_UNAUTHORIZED
            await callback()

            assert socket.end.called, f"WebSocket.end not called on {name} for invalid authorization token assertion"
            socket.end.assert_called_once_with(
                SocketResponseCode.WS_3000_UNAUTHORIZED.value,
                {"message": "Invalid token", "code": SocketResponseCode.WS_3000_UNAUTHORIZED.value},
            )

            socket.reset_all()

            # Test if the authorization token is expired
            mock_validate.return_value = status.HTTP_422_UNPROCESSABLE_ENTITY
            await callback()

            assert socket.end.called, f"WebSocket.end not called on {name} for expired authorization token assertion"
            socket.end.assert_called_once_with(
                SocketResponseCode.WS_3001_EXPIRED_TOKEN.value,
                {"message": "Token has expired", "code": SocketResponseCode.WS_3001_EXPIRED_TOKEN.value},
            )

            socket.reset_all()

            # Test if the authorization token is valid but the user is not found
            mock_validate.return_value = None
            await callback()

            assert socket.end.called, f"WebSocket.end not called on {name} for invalid user assertion"
            socket.end.assert_called_once_with(
                SocketResponseCode.WS_4000_INVALID_CONNECTION.value,
                {"message": "Invalid connection", "code": SocketResponseCode.WS_4000_INVALID_CONNECTION.value},
            )

        socket.reset_all()
