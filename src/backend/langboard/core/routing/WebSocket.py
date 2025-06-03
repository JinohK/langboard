from typing import Any, Literal, Self, cast, overload
from fastapi import WebSocket as FastAPIWebSocket
from ..db import User
from .SocketResponse import SocketResponse
from .SocketResponseCode import SocketResponseCode
from .SocketTopic import SocketTopic


class IWebSocketStream:
    async def start(self, data: Any = None): ...
    async def buffer(self, data: Any = None): ...
    async def end(self, data: Any = None): ...


class WebSocket:
    def __init__(self, ws: FastAPIWebSocket, user: User):
        self.__ws = ws
        self.__user = user
        self._subscriptions: dict[str, set[str]] = {}

    async def flush(self):
        try:
            await self.close()
        except Exception:
            pass
        self.__ws = cast(FastAPIWebSocket, None)
        self.__user = cast(User, None)
        self._subscriptions.clear()

    async def close(self, code: SocketResponseCode | int = SocketResponseCode.WS_1000_NORMAL_CLOSURE):
        await self.__ws.close(code=code.value if isinstance(code, SocketResponseCode) else code)

    def get_topics(self):
        return self._subscriptions

    def get_user(self) -> User:
        return self.__user

    @overload
    async def send(self, event_response: Literal["ping"]): ...
    @overload
    async def send(self, event_response: str, data: Any = None): ...
    @overload
    async def send(self, event_response: SocketResponse): ...
    async def send(self, event_response: SocketResponse | str, data: Any = None) -> Self | None:
        if event_response == "ping":
            await self.__ws.send_text("")
            return self

        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return self

        await self.__ws.send_text(response_model.model_dump_json())
        return self

    async def send_error(
        self,
        error_code: SocketResponseCode | int,
        message: str,
        should_close: bool = True,
    ) -> None:
        _error_code = error_code.value if isinstance(error_code, SocketResponseCode) else error_code
        if should_close:
            await self.__ws.send_json({"message": message, "code": _error_code})
            await self.close(code=_error_code)
            return

        await self.send("error", {"message": message, "code": _error_code})

    def stream(self, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket):
                self.__ws = ws

            async def start(self, data: Any = None):
                await self.__send("start", data)
                return self

            async def buffer(self, data: Any = None):
                await self.__send("buffer", data)
                return self

            async def end(self, data: Any = None):
                await self.__send("end", data)
                self.__ws = None

            async def __send(self, event_response: str, data: Any = None):
                if not self.__ws:
                    return
                await self.__ws.send(f"{event}:{event_response}", data)

        return cast(IWebSocketStream, _WebSocketStream(self))

    def stream_with_topic(self, topic: SocketTopic | str, topic_id: str, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket, topic: SocketTopic | str, topic_id: str):
                self.__ws = ws
                self.__topic = topic if isinstance(topic, str) else topic.value
                self.__topic_id = topic_id

            async def start(self, data: Any = None):
                await self.__send("start", data)
                return self

            async def buffer(self, data: Any = None):
                await self.__send("buffer", data)
                return self

            async def end(self, data: Any = None):
                await self.__send("end", data)
                self.__ws = None

            async def __send(self, event_response: str, data: Any = None):
                if not self.__ws:
                    return
                await self.__ws.send(
                    SocketResponse(
                        event=f"{event}:{event_response}",
                        topic=self.__topic,
                        topic_id=self.__topic_id,
                        data=data,
                    ),
                )

        return cast(IWebSocketStream, _WebSocketStream(self, topic, topic_id))
