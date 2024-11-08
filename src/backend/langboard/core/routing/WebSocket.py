from typing import Any, Self, overload
from socketify import OpCode, SendStatus
from socketify import WebSocket as SocketifyWebSocket
from .SocketResponse import SocketResponse


class WebSocket(SocketifyWebSocket):
    def __init__(self, ws: SocketifyWebSocket):
        for attr in ws.__dict__:
            setattr(self, attr, ws.__dict__[attr])

    @overload
    def send(self, event_response: str, data: Any = None, compress: bool = False, fin: bool = True): ...
    @overload
    def send(self, event_response: SocketResponse, compress: bool = False, fin: bool = True): ...
    def send(  # type: ignore
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

        return super().send(response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress, fin=fin)

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

    @overload
    def publish(self, topic: str, event_response: str, data: Any = None, compress: bool = False): ...
    @overload
    def publish(self, topic: str, event_response: SocketResponse, compress: bool = False): ...
    def publish(  # type: ignore
        self,
        topic: str,
        event_response: SocketResponse | str,
        data: Any = None,
        compress: bool = False,
    ) -> Self | SendStatus | None:
        if isinstance(event_response, str):
            response_model = SocketResponse(event=event_response, data=data)
        elif isinstance(event_response, SocketResponse):
            response_model = event_response
        else:
            return self

        return super().publish(
            topic=topic, message=response_model.model_dump_json(), opcode=OpCode.TEXT, compress=compress
        )
