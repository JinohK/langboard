from enum import Enum


class SocketDefaultEvent(Enum):
    OPEN = "open"
    CLOSE = "close"
    SUBSCRIPTION = "subscription"