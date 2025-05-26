from json import loads as json_loads
from fastapi import HTTPException, WebSocketDisconnect, status
from fastapi import WebSocket as FastAPIWebSocket
from ..db import User
from ..routing import (
    GLOBAL_TOPIC_ID,
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
class SocketApp:
    async def route(self, raw_ws: FastAPIWebSocket):
        authorization = raw_ws.query_params.get("authorization", None)
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

        validation_result = await Auth.validate({Auth.AUTHORIZATION_HEADER: authorization})
        if isinstance(validation_result, User):
            pass
        else:
            raise HTTPException(status_code=validation_result)

        ws = WebSocket(raw_ws, validation_result)
        await raw_ws.accept()

        await AppRouter.socket.subscribe(ws, SocketTopic.Global, [GLOBAL_TOPIC_ID])

        await self.__run_events(SocketDefaultEvent.Open, self.__create_request(ws))

        try:
            while True:
                message = await raw_ws.receive_text()
                try:
                    await self.__validate_token(authorization)
                except SocketStatusCodeException as e:
                    await ws.send_error(e.code, e.message)
                    return
                await self.__on_message(ws, message)
        except SocketStatusCodeException as e:
            await ws.send_error(e.code, e.message)
        except WebSocketDisconnect:
            pass
        except Exception:
            pass

        try:
            await self.__run_events(SocketDefaultEvent.Close, self.__create_request(ws))
            await AppRouter.socket.unsubscribe_all(ws)
        except Exception:
            pass

    async def __on_message(self, ws: WebSocket, message: str):
        if not message:
            await ws.send("ping")
            return

        try:
            data = json_loads(message)
            if not isinstance(data, dict) or "event" not in data or not isinstance(data["event"], str):
                raise Exception()
        except Exception:
            await ws.send_error(SocketResponseCode.WS_4001_INVALID_DATA, "Invalid data", should_close=False)
            return

        event = data.pop("event")
        if await AppRouter.socket.toggle_subscription(ws, event, data):
            return

        event_data = data.get("data", data)

        req = self.__create_request(
            ws,
            event_data,
            from_app={"topic": data.get("topic", None), "topic_id": data.get("topic_id", None)},
        )

        await self.__run_events(event, req)

    async def __validate_token(self, token: str):
        """Validates the given token.

        :param ws: The websocket to send the error to.
        :param token: The token to validate.
        """
        validation_result = await Auth.validate({"Authorization": token})

        if isinstance(validation_result, User):
            return
        elif validation_result == status.HTTP_422_UNPROCESSABLE_ENTITY:
            raise SocketStatusCodeException(SocketResponseCode.WS_3001_EXPIRED_TOKEN, "Token has expired")
        elif validation_result == status.HTTP_401_UNAUTHORIZED:
            raise SocketStatusCodeException(SocketResponseCode.WS_3000_UNAUTHORIZED, "Invalid token")
        else:
            raise SocketStatusCodeException(SocketResponseCode.WS_4000_INVALID_CONNECTION, "Invalid connection")

    def __create_request(
        self, ws: WebSocket, data: dict | list | None = None, from_app: dict | None = None
    ) -> SocketRequest:
        req = SocketRequest(
            socket=ws,
            data=data,
            from_app=from_app,
        )
        return req

    async def __run_events(self, event_name: SocketDefaultEvent | str, req: SocketRequest) -> None:
        route_events = await AppRouter.socket.get_events(event_name)
        cached_params: TCachedScopes = {}

        for event in route_events:
            response = await event.run(cached_params, req)

            if isinstance(response, SocketStatusCodeException):
                await req.socket.send_error(
                    response.code,
                    response.message,
                    should_close=False,
                )
                return

            if isinstance(response, SocketEventException):
                await req.socket.send_error(
                    SocketResponseCode.WS_1011_INTERNAL_ERROR,
                    str(response.raw_exception),
                    should_close=False,
                )
                return

            if isinstance(response, SocketManagerScopeException):
                await req.socket.send_error(
                    SocketResponseCode.WS_4001_INVALID_DATA, str(response.raw_exception), should_close=False
                )
                return

            if isinstance(response, SocketResponse):
                await req.socket.send(response)

        for event in route_events:
            await event.finish_generators()
