from typing import Any, Self, overload
from socketify import OpCode, SendStatus
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
    def send(  # type: ignore
        self,
        response: SocketResponse | None = None,
        event: str | None = None,
        data: Any = None,
        compress: bool = False,
        fin: bool = True,
    ) -> Self | SendStatus | None:
        if event:
            response_model = SocketResponse(event=event, data=data)
        elif response is not None:
            response_model = response
        else:
            return self

        return super().send(response_model.model_dump(), opcode=OpCode.TEXT, compress=compress, fin=fin)
