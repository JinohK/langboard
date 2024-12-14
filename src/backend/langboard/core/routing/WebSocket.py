from enum import Enum
from typing import Any, Self, overload
from socketify import OpCode, SendStatus
from socketify import WebSocket as SocketifyWebSocket
from ..service import ModelIdService
from .SocketResponse import SocketResponse
from .SocketTopic import SocketTopic


class WebSocket(SocketifyWebSocket):
    def __init__(self, ws: SocketifyWebSocket):
        for attr in ws.__dict__:
            setattr(self, attr, ws.__dict__[attr])
        self.__ws = ws

    def get_topics(self):
        return self.__ws.get_topics()

    def subscribe(self, topic: str):
        self.__ws.subscribe(topic)

    def unsubscribe(self, topic: str):
        self.__ws.unsubscribe(topic)

    @overload
    def send(self, event_response: str, data: Any = None, compress: bool = False, fin: bool = True): ...
    @overload
    def send(self, event_response: SocketResponse, data: None = None, compress: bool = False, fin: bool = True): ...
    def send(
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

        result = self.__ws.send(response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress, fin=fin)
        if isinstance(result, SocketifyWebSocket):
            return self
        return result

    def stream(self, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket):
                self.__ws = ws

            def start(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return self
                self.__ws.send(f"{event}:start", data, compress=compress)
                return self

            def buffer(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return self
                self.__ws.send(f"{event}:buffer", data, compress=compress)
                return self

            def end(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return
                self.__ws.send(f"{event}:end", data, compress=compress)
                self.__ws = None

        return _WebSocketStream(self)

    def stream_with_topic(self, topic: SocketTopic | str, topic_id: str, event: str):
        class _WebSocketStream:
            def __init__(self, ws: WebSocket, topic: SocketTopic | str, topic_id: str):
                self.__ws = ws
                self.__topic = topic if isinstance(topic, str) else topic.value
                self.__topic_id = topic_id

            def start(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return self
                self.__ws.send(
                    SocketResponse(
                        event=f"{event}:start",
                        topic=self.__topic,
                        topic_id=self.__topic_id,
                        data=data,
                    ),
                    compress=compress,
                )
                return self

            def buffer(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return self
                self.__ws.send(
                    SocketResponse(
                        event=f"{event}:buffer",
                        topic=self.__topic,
                        topic_id=self.__topic_id,
                        data=data,
                    ),
                    compress=compress,
                )
                return self

            def end(self, data: Any = None, compress: bool = False):
                if not self.__ws:
                    return
                self.__ws.send(
                    SocketResponse(
                        event=f"{event}:end",
                        topic=self.__topic,
                        topic_id=self.__topic_id,
                        data=data,
                    ),
                    compress=compress,
                )
                self.__ws = None

        return _WebSocketStream(self, topic, topic_id)

    @overload
    async def publish(
        self, topic: SocketTopic | str, topic_id: str, event_response: str, data: Any = None, compress: bool = False
    ): ...
    @overload
    async def publish(
        self,
        topic: SocketTopic | str,
        topic_id: str,
        event_response: SocketResponse,
        data: None = None,
        compress: bool = False,
    ): ...
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

        if "model_id" in (response_model.data or {}):
            model_id = response_model.data.pop("model_id")
            data = await ModelIdService.get_model(model_id)
            response_model.data.update(data)

        if isinstance(topic, Enum):
            topic = topic.value

        response_model.topic = topic
        response_model.topic_id = topic_id

        socket_topic = f"{topic}:{topic_id}"

        return self.__ws.publish(
            topic=socket_topic, message=response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress
        )
