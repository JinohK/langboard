from json import loads as json_loads
from typing import Union
from socketify import OpCode, Request, Response
from socketify import WebSocket as SocketifyWebSocket
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

    def on_upgrade(self, res: Response, req: Request, socket_context) -> None:
        path = req.get_url()
        route, route_data = AppRouter.socket.get_route(path)
        if not route:
            res.close()
            return

        # TODO: Check authentication

        route_path = route_data.pop("route")

        user_data = {
            "path": path,
            "route_path": route_path,
            "route_data": route_data,
        }

        key = req.get_header("sec-websocket-key")
        protocol = req.get_header("sec-websocket-protocol")
        extensions = req.get_header("sec-websocket-extensions")

        res.upgrade(key, protocol, extensions, socket_context, user_data)

    async def on_open(self, ws: SocketifyWebSocket) -> None:
        user_data = ws.get_user_data()
        if not AppRouter.socket.is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.InvalidConnection)
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Open)
        req = self._create_request(ws, user_data["route_data"])

        await self._run_events(route_events, req)

    async def on_message(self, ws: SocketifyWebSocket, message: Union[str | bytes], _: OpCode) -> None:
        user_data = ws.get_user_data()
        if not AppRouter.socket.is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.InvalidConnection)
            return

        try:
            data = json_loads(message)
            if not isinstance(data, dict) or "event" not in data or not isinstance(data["event"], str):
                raise Exception()
        except Exception:
            self._send_error(ws, "Invalid data", error_code=SocketResponseCode.InvalidData, should_close=False)
            return

        event = data.pop("event")
        route_events = AppRouter.socket.get_events(user_data["route_path"], event)
        req = self._create_request(ws, user_data["route_data"], data)

        await self._run_events(route_events, req)

    async def on_close(self, ws: SocketifyWebSocket, code: int, message: Union[bytes, str] | None) -> None:
        user_data = ws.get_user_data()
        if not AppRouter.socket.is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.InvalidConnection)
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Close)
        req = self._create_request(ws, user_data["route_data"], {"message": message}, code=code)

        await self._run_events(route_events, req)

    async def on_drain(self, ws: SocketifyWebSocket) -> None:
        user_data = ws.get_user_data()
        if not AppRouter.socket.is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.InvalidConnection)
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Drain)
        req = self._create_request(ws, user_data["route_data"])

        await self._run_events(route_events, req)

    async def on_subscription(self, ws: SocketifyWebSocket, topic: str, **kwargs) -> None:
        user_data = ws.get_user_data()
        if not AppRouter.socket.is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.InvalidConnection)
            return

        route_events = AppRouter.socket.get_events(user_data["route_path"], SocketDefaultEvent.Subscription)
        req = self._create_request(ws, user_data["route_data"], {"topic": topic}, **kwargs)

        await self._run_events(route_events, req)

    def _create_request(
        self, ws: SocketifyWebSocket, route_data: dict, data: dict | list | None = None, **kwargs
    ) -> SocketRequest:
        socket = WebSocket(ws)
        req = SocketRequest(socket=socket, route_data=route_data, data=data, **kwargs)
        return req

    def _send_error(
        self, ws: SocketifyWebSocket, message: str, error_code: SocketResponseCode, should_close: bool = True
    ) -> None:
        if should_close:
            ws.end(error_code, {"message": message, "code": error_code.value})
        else:
            ws.send({"event": "error", "data": {"message": message, "code": error_code.value}})

    async def _run_events(self, route_events: list[SocketEvent], req: SocketRequest) -> None:
        cached_params: TCachedScopes = {}

        for event in route_events:
            response = await event.run(cached_params, req)

            if isinstance(response, Exception):
                self._send_error(req.socket, str(response), SocketResponseCode.InvalidData)
                return

            if isinstance(response, SocketResponse):
                req.socket.send(response.data)
