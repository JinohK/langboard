from json import loads as json_loads
from typing import Any, Union, cast
from fastapi import status
from socketify import OpCode, Request, Response
from socketify import WebSocket as SocketifyWebSocket
from ..db import User
from ..routing import (
    AppRouter,
    SocketDefaultEvent,
    SocketRequest,
    SocketResponse,
    SocketResponseCode,
    SocketTopic,
    TCachedScopes,
    WebSocket,
)
from ..routing.Exception import SocketEventException, SocketManagerScopeException, SocketStatusCodeException
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
        AppRouter.set_socketify_app(req.app)

        req.preserve()

        queries = req.get_queries()
        if queries is None:
            res.send(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)
            return
        else:
            validation_result = await Auth.validate(queries)
            if isinstance(validation_result, User):
                pass
            elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
                res.send(status=status.HTTP_422_UNPROCESSABLE_ENTITY, end_connection=True)
                return
            else:
                res.send(status=status.HTTP_401_UNAUTHORIZED, end_connection=True)
                return

        auth_token = queries.get("Authorization", queries.get("authorization", None))
        auth_token = auth_token[0] if isinstance(auth_token, list) else auth_token

        user_data = {
            "auth_user_id": validation_result.id,
            "auth_token": auth_token,
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

        req = self._create_request(ws, user_data)
        req.socket.subscribe(SocketTopic.Global, ["all"])

        await self._run_events(SocketDefaultEvent.Open, req)

    async def on_message(self, ws: SocketifyWebSocket, message: str | bytes, code: OpCode) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        if not message:
            ws.send("", OpCode.PONG)
            return

        try:
            data = json_loads(message)
            if not isinstance(data, dict) or "event" not in data or not isinstance(data["event"], str):
                raise Exception()
        except Exception:
            self._send_error(ws, "Invalid data", error_code=SocketResponseCode.WS_4001_INVALID_DATA, should_close=False)
            return

        event = data.pop("event")
        if await self._toggle_subscription(ws, event, data, user_data):
            return

        event_data = data.get("data", data)

        req = self._create_request(
            ws,
            user_data,
            event_data,
            from_app={"topic": data.get("topic", None), "topic_id": data.get("topic_id", None)},
        )

        await self._run_events(event, req)

    async def on_close(self, ws: SocketifyWebSocket, code: int, message: Union[bytes, str] | None) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        req = self._create_request(
            ws,
            user_data,
            {"message": message},
            from_app={"code": code},
        )

        await self._run_events(SocketDefaultEvent.Close, req)

    async def on_drain(self, ws: SocketifyWebSocket) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        req = self._create_request(ws, user_data)

        await self._run_events(SocketDefaultEvent.Drain, req)

    async def on_subscription(self, ws: SocketifyWebSocket, topic: str, subscriptions, subscriptions_before) -> None:
        user_data = ws.get_user_data()
        if not user_data or not self._is_valid_user_data(user_data):
            self._send_error(ws, "Invalid connection", error_code=SocketResponseCode.WS_4000_INVALID_CONNECTION)
            return

        if not await self._validate_token(ws, user_data["auth_token"]):
            return

        req = self._create_request(
            ws,
            user_data,
            {"topic": topic},
            from_app={
                "subscriptions": subscriptions,
                "subscriptions_before": subscriptions_before,
            },
        )

        await self._run_events(SocketDefaultEvent.Subscription, req)

    def _is_valid_user_data(self, user_data: Any | None) -> bool:
        """Checks if the given user data is valid.

        :param user_data: The user data to check.
        """
        return (
            isinstance(user_data, dict)
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
            ws.send("error", {"message": message, "code": _error_code})
        else:
            ws.send({"event": "error", "data": {"message": message, "code": _error_code}}, OpCode.TEXT)

    async def _toggle_subscription(self, ws: SocketifyWebSocket, event: str, data: dict, user_data: Any) -> bool:
        if event != "subscribe" and event != "unsubscribe":
            return False

        websocket = WebSocket(ws)

        is_subscribe = event == "subscribe"
        topic = data.get("topic", None)
        topic_id = data.get("topic_id", None)
        if not topic or not topic_id:
            self._send_error(ws, "Invalid data", error_code=SocketResponseCode.WS_4001_INVALID_DATA, should_close=False)
            return True

        topic_ids = [topic_id] if not isinstance(topic_id, list) else topic_id

        if is_subscribe:
            validator = AppRouter.socket.get_subscription_validator(topic)
            user = cast(User, await Auth.get_user_by_id(user_data["auth_user_id"]))
            if validator:
                validated_topic_ids = []
                for topic_id in topic_ids:
                    if await validator(topic_id, user):
                        validated_topic_ids.append(topic_id)
            else:
                validated_topic_ids = topic_ids

            result = websocket.subscribe(topic, validated_topic_ids)
            if isinstance(result, SocketResponseCode):
                self._send_error(ws, "Forbidden", error_code=result, should_close=False)
                return True
        else:
            websocket.unsubscribe(topic, topic_ids)

        return True

    def _create_request(
        self, ws: SocketifyWebSocket, user_data: dict, data: dict | list | None = None, from_app: dict | None = None
    ) -> SocketRequest:
        socket = WebSocket(ws)
        req = SocketRequest(
            socket=socket,
            data=data,
            from_app={
                **(from_app or {}),
                "auth_user_id": user_data["auth_user_id"],
            },
        )
        return req

    async def _run_events(self, event_name: SocketDefaultEvent | str, req: SocketRequest) -> None:
        route_events = await AppRouter.socket.get_events(event_name)
        cached_params: TCachedScopes = {}

        for event in route_events:
            response = await event.run(cached_params, req)

            if isinstance(response, SocketStatusCodeException):
                self._send_error(
                    req.socket,
                    response.message,
                    response.code,
                    should_close=False,
                )
                return

            if isinstance(response, SocketEventException):
                self._send_error(
                    req.socket,
                    str(response.raw_exception),
                    SocketResponseCode.WS_1011_INTERNAL_ERROR,
                    should_close=False,
                )
                return

            if isinstance(response, SocketManagerScopeException):
                self._send_error(
                    req.socket, str(response.raw_exception), SocketResponseCode.WS_4001_INVALID_DATA, should_close=False
                )
                return

            if isinstance(response, SocketResponse):
                req.socket.send(response)

        for event in route_events:
            await event.finish_generators()
