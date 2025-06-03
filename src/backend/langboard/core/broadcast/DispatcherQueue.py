from multiprocessing import Queue
from typing import Any, overload
from ...Constants import BROADCAST_TYPE
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseDispatcherQueue import BaseDispatcherQueue
from .DispatcherModel import DispatcherModel


@class_instance()
@thread_safe_singleton
class DispatcherQueue(BaseDispatcherQueue):
    @property
    def is_closed(self) -> bool:
        return self.__instance.is_closed

    def __init__(self):
        if BROADCAST_TYPE == "in-memory":
            from .memory import MemoryDispatcherQueue

            self.__instance = MemoryDispatcherQueue()
        elif BROADCAST_TYPE == "kafka":
            from .kafka import KafkaDispatcherQueue

            self.__instance = KafkaDispatcherQueue()
        else:
            raise ValueError(f"Unsupported BROADCAST_TYPE: {BROADCAST_TYPE}")

    def start(self, worker_queues: list[Queue]):
        self.__instance.start(worker_queues)

    @overload
    def put(self, event: str, data: dict[str, Any]): ...
    @overload
    def put(self, event: DispatcherModel): ...
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        self.__instance.put(event, data)

    def close(self):
        self.__instance.close()
