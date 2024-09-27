from typing import Any, Self, overload
from socketify import OpCode
from socketify import WebSocket as SocketifyWebSocket
from .SocketResponse import SocketResponse


class WebSocket(SocketifyWebSocket):
    def __init__(self, ws: SocketifyWebSocket):
        for attr in ws.__dict__:
            setattr(self, attr, ws.__dict__[attr])

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
