from typing import Any
from ..BaseDispatcherQueue import BaseDispatcherQueue
from ..DispatcherModel import DispatcherModel, record_model


class MemoryDispatcherQueue(BaseDispatcherQueue):
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None):
        record_model(event, data, file_only=True)

    def start(self):
        self.is_closed = False

    def close(self):
        self.is_closed = True
