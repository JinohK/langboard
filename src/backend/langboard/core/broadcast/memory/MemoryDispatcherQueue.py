from multiprocessing import Queue
from typing import Any
from ..BaseDispatcherQueue import BaseDispatcherQueue
from ..DispatcherModel import DispatcherModel, record_model


class MemoryDispatcherQueue(BaseDispatcherQueue):
    def __init__(self):
        self.__worker_queues: list[Queue] = []
        super().__init__()

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

    def start(self, worker_queues):
        self.__worker_queues = worker_queues
        self.is_closed = False

    def close(self):
        if not self.__worker_queues:
            return

        for worker_queue in self.__worker_queues:
            worker_queue.put("EOF")
            try:
                worker_queue.put_nowait("EOF")
            except Exception:
                continue

        self.is_closed = True
        self.__worker_queues.clear()
