from abc import ABC, abstractmethod
from typing import Any
from .DispatcherModel import DispatcherModel


class BaseDispatcherQueue(ABC):
    def __init__(self):
        self.is_closed = True

    @abstractmethod
    async def start(self): ...

    @abstractmethod
    def put(self, event: str | DispatcherModel, data: dict[str, Any] | None = None): ...

    @abstractmethod
    def close(self): ...
