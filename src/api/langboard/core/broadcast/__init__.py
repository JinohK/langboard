from core.broadcast import DispatcherQueue
from core.Env import Env
from .DispatcherModel import DispatcherModel


__all__ = [
    "DispatcherModel",
]


if Env.BROADCAST_TYPE == "in-memory":
    from .memory import MemoryDispatcherQueue

    instance = MemoryDispatcherQueue()
elif Env.BROADCAST_TYPE == "kafka":
    from .kafka import KafkaDispatcherQueue

    instance = KafkaDispatcherQueue()
else:
    raise ValueError(f"Unsupported BROADCAST_TYPE: {Env.BROADCAST_TYPE}")

DispatcherQueue.set_queue(instance)


def ensure_initialized():
    pass
