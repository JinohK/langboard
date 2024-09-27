from .WebSocket import WebSocket


class SocketRequest:
    """Represents a socket request.

    The purpose of this class is to pass to the socket route handlers the necessary data to handle the request.
    """

    data: list | dict | None
    route_data: dict
    socket: WebSocket
    from_app: dict

    def __init__(self, socket: WebSocket, route_data: dict, data: list | dict | None, from_app: dict | None = None):
        self.socket = socket
        self.route_data = route_data
        self.data = data
        self.from_app = from_app or {}
