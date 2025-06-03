from abc import ABC, abstractmethod
from multiprocessing import Queue
from typing import Any, Callable, Coroutine, cast


TConsumer = Callable[[dict[str, Any]], Coroutine[Any, Any, None] | None]


class BaseWorkerQueue(ABC):
    def __init__(self):
        self.queue = cast(Queue, None)
        self.__consumers: dict[str, TConsumer] = {}

    @abstractmethod
    def start(self): ...

    def consume(self, event: str):
        if event in self.__consumers:
            raise NameError(f"Consumer for event '{event}' already exists.")

        def add_consumer(func: TConsumer):
            self.__consumers[event] = func
            return func

        return add_consumer

    def get_consumer(self, event: str) -> TConsumer | None:
        return self.__consumers.get(event, None)

    def get_consumer_names(self) -> list[str]:
        return list(self.__consumers.keys())
