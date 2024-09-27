from enum import Enum


class SocketResponseCode(Enum):
    ServerError = 1000
    InvalidConnection = 1001
    InvalidData = 1002
