from typing import Any, Self, overload
from socketify import OpCode
from socketify import WebSocket as SocketifyWebSocket
from .SocketResponse import SocketResponse


class WebSocket(SocketifyWebSocket):
    def __init__(self, ws: SocketifyWebSocket):
        self.ws = ws.ws
        self._ptr = ws._ptr
        self.app = ws.app
        self._cork_handler = ws._cork_handler
        self._for_each_topic_handler = ws._for_each_topic_handler
        self.socket_data_id = ws.socket_data_id
        self.socket_data = ws.socket_data
        self.got_socket_data = ws.got_socket_data

    @overload
    def send(self, event: str, data: Any = None): ...
    @overload
    def send(self, response: SocketResponse): ...
    @overload
    def send(self, event: str, data: Any = None, compress: bool = False, fin: bool = True): ...
    @overload
    def send(self, response: SocketResponse, compress: bool = False, fin: bool = True): ...
    def send(
        self,
        response: SocketResponse | None = None,
        event: str | None = None,
        data: Any = None,
        compress: bool = False,
        fin: bool = True,
    ) -> Self | None:
        if not response and not event:
            return self

        if event:
            response = SocketResponse(event=event, data=data)

        return super().send(response.model_dump(), opcode=OpCode.TEXT, compress=compress, fin=fin)
