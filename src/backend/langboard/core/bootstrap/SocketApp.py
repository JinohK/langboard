from json import loads as json_loads
from typing import Any, Union, cast
from fastapi import status
from socketify import OpCode, Request, Response
from socketify import WebSocket as SocketifyWebSocket
from ...models import User
from ..routing import (
    AppRouter,
    SocketDefaultEvent,
    SocketEvent,
    SocketRequest,
    SocketResponse,
    SocketResponseCode,
    TCachedScopes,
    WebSocket,
)
from ..routing.Exception import SocketEventException, SocketRouterScopeException
from ..security import Auth
from ..utils.decorators import thread_safe_singleton


@thread_safe_singleton
class SocketApp(dict):
    """Manages the socket application for :class:`socketify.ASGI`."""

    def __init__(self):
        self["upgrade"] = self.on_upgrade
        self["open"] = self.on_open
        self["message"] = self.on_message
        self["close"] = self.on_close
        self["subscription"] = self.on_subscription

    async def on_upgrade(self, res: Response, req: Request, socket_context) -> None:
        path = req.get_url()
        if not isinstance(path, str):
            res.send(status=status.HTTP_404_NOT_FOUND, end_connection=True)
            return

        route, route_data = AppRouter.socket.get_route(path)
        if not route:
            res.send(status=status.HTTP_404_NOT_FOUND, end_connection=True)
            return
        route_data = cast(dict, route_data)

        queries = req.get_queries()
        if queries is None:
            res.send(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)
            return

        validation_result = await Auth.validate(queries)
        if isinstance(validation_result, User):
            pass
        elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
            res.send(status=status.HTTP_422_UNPROCESSABLE_ENTITY, end_connection=True)
            return
        else:
            res.send(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)
            return

        route_path = route_data.pop("route")

        user_data = {
            "path": path,
            "route_path": route_path,
            "route_data": route_data,
            "auth_user_id": validation_result.id,
            "auth_token": queries.get("Authorization", queries.get("authorization", None)),
        }

        key = req.get_header("sec-websocket-key")
        protocol = req.get_header("sec-websocket-protocol")
        extensions = req.get_header("sec-websocket-extensions")

        res.upgrade(key, protocol, extensions, socket_context, user_data)

    async def on_open(self, ws: SocketifyWebSocket) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Open)
        req = self._create_request(ws, user_data["route_data"], from_app={"auth_user_id": user_data["auth_user_id"]})

        await self._run_events(route_events, req)

    async def on_message(self, ws: SocketifyWebSocket, message: str | bytes, _: OpCode) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        try:
            data = json_loads(message)
            if not isinstance(data, dict) or "event" not in data or not isinstance(data["event"], str):
                raise Exception()
        except Exception:
            self._send_error(ws, "Invalid data", error_code=SocketResponseCode.WS_4001_INVALID_DATA, should_close=False)
            return

        event = data.pop("event")
        route_events = AppRouter.socket.get_events(user_data["route_path"], event)
        req = self._create_request(ws, user_data["route_data"], data)

        await self._run_events(route_events, req)

    async def on_close(self, ws: SocketifyWebSocket, code: int, message: Union[bytes, str] | None) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Close)
        req = self._create_request(
            ws,
            user_data["route_data"],
            {"message": message},
            from_app={"auth_user_id": user_data["auth_user_id"], "code": code},
        )

        await self._run_events(route_events, req)

    async def on_drain(self, ws: SocketifyWebSocket) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Drain)
        req = self._create_request(ws, user_data["route_data"], from_app={"auth_user_id": user_data["auth_user_id"]})

        await self._run_events(route_events, req)

    async def on_subscription(self, ws: SocketifyWebSocket, topic: str, **kwargs) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Subscription)
        req = self._create_request(
            ws,
            user_data["route_data"],
            {"topic": topic},
            from_app={"auth_user_id": user_data["auth_user_id"], **kwargs},
        )

        await self._run_events(route_events, req)

    def _is_valid_user_data(self, user_data: Any | None) -> bool:
        """Checks if the given user data is valid.

        :param user_data: The user data to check.
        """
        return (
            isinstance(user_data, dict)
            and "path" in user_data
            and isinstance(user_data["path"], str)
            and "route_data" in user_data
            and isinstance(user_data["route_data"], dict)
            and "route_path" in user_data
            and isinstance(user_data["route_path"], str)
            and "auth_user_id" in user_data
            and isinstance(user_data["auth_user_id"], int)
            and "auth_token" in user_data
            and isinstance(user_data["auth_token"], str)
        )

    async def _validate_token(self, ws: SocketifyWebSocket, token: str) -> bool:
        """Validates the given token.

        :param ws: The websocket to send the error to.
        :param token: The token to validate.
        """
        validation_result = await Auth.validate({"Authorization": token})

        if isinstance(validation_result, User):
            return True
        elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
            self._send_error(ws, "Token has expired", error_code=SocketResponseCode.WS_3001_EXPIRED_TOKEN)
            return False
        elif validation_result == status.HTTP_401_UNAUTHORIZED:
            self._send_error(ws, "Invalid token", error_code=SocketResponseCode.WS_3000_UNAUTHORIZED)
            return False
        else:
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return False

    def _send_error(
        self,
        ws: SocketifyWebSocket | WebSocket,
        message: str,
        error_code: SocketResponseCode | int,
        should_close: bool = True,
    ) -> None:
        _error_code = error_code.value if isinstance(error_code, SocketResponseCode) else error_code
        if should_close:
            ws.end(_error_code, {"message": message, "code": _error_code})
            return

        if isinstance(ws, WebSocket):
            ws.send(event="error", data={"message": message, "code": _error_code})
        else:
            ws.send({"event": "error", "data": {"message": message, "code": _error_code}})

    def _create_request(
        self, ws: SocketifyWebSocket, route_data: dict, data: dict | list | None = None, from_app: dict | None = None
    ) -> SocketRequest:
        socket = WebSocket(ws)
        req = SocketRequest(socket=socket, route_data=route_data, data=data, from_app=from_app)
        return req

    async def _run_events(self, route_events: list[SocketEvent], req: SocketRequest) -> None:
        cached_params: TCachedScopes = {}

        for event in route_events:
            response = await event.run(cached_params, req)

            if isinstance(response, SocketEventException):
                self._send_error(
                    req.socket,
                    str(response.raw_exception),
                    SocketResponseCode.WS_1011_INTERNAL_ERROR,
                    should_close=False,
                )
                return

            if isinstance(response, SocketRouterScopeException):
                self._send_error(
                    req.socket, str(response.raw_exception), SocketResponseCode.WS_4001_INVALID_DATA, should_close=False
                )
                return

            if isinstance(response, SocketResponse):
                req.socket.send(response=response)
