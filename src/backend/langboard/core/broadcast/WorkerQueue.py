from asyncio import run as async_run
from inspect import iscoroutinefunction
from multiprocessing import Queue
from time import sleep
from typing import Any, Callable, Coroutine, cast
from ..utils.decorators import class_instance, thread_safe_singleton
from .DispatcherModel import load_model


@class_instance()
@thread_safe_singleton
class WorkerQueue:
    queue: Queue

    def __init__(self):
        self.queue = cast(Queue, "")
        self.__consumers: dict[str, Callable] = {}

    def start(self):
        while True:
            if not self.queue:
                sleep(0.5)
                continue

            try:
                data_file_name: str = self.queue.get()
                if not isinstance(data_file_name, str):
                    raise TypeError
            except Exception:
                continue

            if data_file_name == "EOF":
                self.queue.close()
                break

            try:
                model = load_model(data_file_name)
                if not model:
                    raise ValueError("")

                consumer = self.__consumers.get(model.event, None)
                if not consumer:
                    raise NameError("")

                if iscoroutinefunction(consumer):
                    async_run(consumer(model.data))
                else:
                    consumer(model.data)
            except Exception:
                continue

    def consume(self, event: str):
        if event in self.__consumers:
            raise NameError(f"Consumer for event '{event}' already exists.")

        def add_consumer(
            func: Callable[[dict[str, Any]], Coroutine[Any, Any, None] | None],
        ):
            self.__consumers[event] = func
            return func

        return add_consumer
