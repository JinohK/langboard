from collections import deque
from enum import Enum
from typing import Any, Self, cast, overload
from socketify import OpCode, SendStatus
from socketify import WebSocket as SocketifyWebSocket
from typing_extensions import deprecated
from .SocketResponse import SocketResponse
from .SocketTopic import SocketTopic


class IWebSocketStream:
    async def start(self, data: Any = None, compress: bool = False): ...
    async def buffer(self, data: Any = None, compress: bool = False): ...
    async def end(self, data: Any = None, compress: bool = False): ...


class WebSocket(SocketifyWebSocket):
    MAX_BACKPRESSURE = 16 * 1024 * 1024

    def __init__(self, ws: SocketifyWebSocket, message_queue: deque):
        for attr in ws.__dict__:
            setattr(self, attr, ws.__dict__[attr])
        self.__ws = ws
        self.__message_queue = message_queue

    async def get_topics(self):
        return self.__ws.get_topics()

    async def subscribe(self, topic: str | SocketTopic, topic_ids: list[str]):
        if isinstance(topic, Enum):
            topic = topic.value

        for topic_id in topic_ids:
            self.__ws.subscribe(f"{topic}:{topic_id}")
        await self.send(event_response=SocketResponse(event="subscribed", topic=topic, topic_id=cast(str, topic_ids)))

    async def unsubscribe(self, topic: str | SocketTopic, topic_ids: list[str]):
        if isinstance(topic, Enum):
            topic = topic.value
        for topic_id in topic_ids:
            self.__ws.unsubscribe(f"{topic}:{topic_id}")
        await self.send(event_response=SocketResponse(event="unsubscribed", topic=topic, topic_id=cast(str, topic_ids)))

    @overload
    async def send(self, event_response: str, data: Any = None, compress: bool = False, fin: bool = True): ...
    @overload
    async def send(
        self, event_response: SocketResponse, data: None = None, compress: bool = False, fin: bool = True
    ): ...
    async def send(
        self,
        event_response: SocketResponse | str,
        data: Any = None,
        compress: bool = False,
        fin: bool = True,
    ) -> Self | SendStatus | None:
        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return self

        if self.has_backpressure():
            self.__message_queue.append(response_model)
            return self

        result = self.__ws.send(response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress, fin=fin)
        if result == SendStatus.BACKPRESSURE or result == SendStatus.DROPPED:
            self.__message_queue.append(response_model)
            return self

        if isinstance(result, SocketifyWebSocket):
            return self
        return result

    def stream(self, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket):
                self.__ws = ws

            async def start(self, data: Any = None, compress: bool = False):
                await self.__send("start", data, compress=compress)
                return self

            async def buffer(self, data: Any = None, compress: bool = False):
                await self.__send("buffer", data, compress=compress)
                return self

            async def end(self, data: Any = None, compress: bool = False):
                await self.__send("end", data, compress=compress)
                self.__ws = None

            async def __send(self, event_response: str, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return
                await self.__ws.send(f"{event}:{event_response}", data, compress=compress)

        return cast(IWebSocketStream, _WebSocketStream(self))

    def stream_with_topic(self, topic: SocketTopic | str, topic_id: str, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket, topic: SocketTopic | str, topic_id: str):
                self.__ws = ws
                self.__topic = topic if isinstance(topic, str) else topic.value
                self.__topic_id = topic_id

            async def start(self, data: Any = None, compress: bool = False):
                await self.__send("start", data, compress=compress)
                return self

            async def buffer(self, data: Any = None, compress: bool = False):
                await self.__send("buffer", data, compress=compress)
                return self

            async def end(self, data: Any = None, compress: bool = False):
                await self.__send("end", data, compress=compress)
                self.__ws = None

            async def __send(self, event_response: str, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return
                await self.__ws.send(
                    SocketResponse(
                        event=f"{event}:{event_response}",
                        topic=self.__topic,
                        topic_id=self.__topic_id,
                        data=data,
                    ),
                    compress=compress,
                )

        return cast(IWebSocketStream, _WebSocketStream(self, topic, topic_id))

    def has_backpressure(self) -> bool:
        return self.__ws.get_buffered_amount() >= self.MAX_BACKPRESSURE

    @deprecated(
        """
        🚨 Do not use this method. Use `await AppRouter.publish` instead.
        """
    )
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse | str,
        data: Any = None,
        compress: bool = False,
    ) -> bool:
        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return False

        if isinstance(topic, Enum):
            topic = topic.value

        response_model.topic = topic
        response_model.topic_id = topic_id

        socket_topic = f"{topic}:{topic_id}"

        return self.__ws.publish(
            topic=socket_topic, message=response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress
        )
