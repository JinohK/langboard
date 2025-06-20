from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel


class BaseDispatcherQueue(ABC):
    def __init__(self):
        self.is_closed = True

    @abstractmethod
    async def put(self, event: str | BaseModel, data: dict[str, Any] | None = None): ...

    @abstractmethod
    def start(self): ...

    @abstractmethod
    def close(self): ...
