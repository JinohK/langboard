from multiprocessing import Queue
from typing import Any, overload
from ..utils.decorators import class_instance, thread_safe_singleton
from .DispatcherModel import DispatcherModel


@class_instance()
@thread_safe_singleton
class DispatcherQueue:
    worker_queues: list[Queue] = []
    is_closed: bool = False

    @overload
    def put(self, event: str, data: dict[str, Any]): ...
    @overload
    def put(self, event: DispatcherModel): ...
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        if not self.worker_queues:
            return

        if isinstance(event, str):
            if data is None:
                data = {}
            model = DispatcherModel(event=event, data=data)
        else:
            model = event

        for worker_queue in self.worker_queues:
            worker_queue.put(model.model_dump_json())

    def close(self):
        if not self.worker_queues:
            return

        for worker_queue in self.worker_queues:
            worker_queue.put("EOF")

        self.is_closed = True
        self.worker_queues.clear()
