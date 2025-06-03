from abc import ABC, abstractmethod
from multiprocessing import Queue
from typing import Any
from .DispatcherModel import DispatcherModel


class BaseDispatcherQueue(ABC):
    def __init__(self):
        self.is_closed = True

    @abstractmethod
    def start(self, worker_queues: list[Queue]): ...

    @abstractmethod
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None): ...

    @abstractmethod
    def close(self): ...
