from .WebSocket import WebSocket


class SocketRequest:
    """Represents a socket request.

    The purpose of this class is to pass to the socket route handlers the necessary data to handle the request.
    """

    data: list | dict | None
    socket: WebSocket
    from_app: dict

    def __init__(self, socket: WebSocket, data: list | dict | None, from_app: dict | None = None):
        self.socket = socket
        self.data = data
        self.from_app = from_app or {}
