from enum import Enum


class SocketDefaultEvent(Enum):
    Open = "open"
    Close = "close"
    Drain = "drain"
    Subscription = "subscription"
