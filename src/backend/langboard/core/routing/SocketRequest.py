from .WebSocket import WebSocket


class SocketRequest:
    """Represents a socket request.

    The purpose of this class is to pass to the socket route handlers the necessary data to handle the request.
    """

    data: list | dict | None
    route_data: dict
    socket: WebSocket

    def __init__(self, socket: WebSocket, route_data: dict, data: list | dict | None, **kwargs):
        self.socket = socket
        self.route_data = route_data
        self.data = data
        self.__dict__.update(kwargs)
