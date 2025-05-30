from multiprocessing import Queue
from typing import Any, overload
from ..utils.decorators import class_instance, thread_safe_singleton
from .DispatcherModel import DispatcherModel, record_model


@class_instance()
@thread_safe_singleton
class DispatcherQueue:
    @property
    def is_closed(self) -> bool:
        return self.__is_closed

    def __init__(self):
        self.__worker_queues: list[Queue] = []
        self.__is_closed = True

    @overload
    def put(self, event: str, data: dict[str, Any]): ...
    @overload
    def put(self, event: DispatcherModel): ...
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        if not self.__worker_queues:
            record_model(event, data, file_only=True)
            return

        data_file_name = record_model(event, data)
        for worker_queue in self.__worker_queues:
            try:
                worker_queue.put(data_file_name)
                break
            except Exception:
                continue

    def start(self, worker_queues: list[Queue]):
        self.__worker_queues = worker_queues
        self.__is_closed = False

    def close(self):
        if not self.__worker_queues:
            return

        for worker_queue in self.__worker_queues:
            worker_queue.put("EOF")

        self.__is_closed = True
        self.__worker_queues.clear()
