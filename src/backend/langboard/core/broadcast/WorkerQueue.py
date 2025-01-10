from asyncio import run as async_run
from inspect import iscoroutinefunction
from multiprocessing import Queue
from time import sleep
from typing import Any, Callable, Coroutine, cast
from ..utils.decorators import class_instance, thread_safe_singleton
from .DispatcherModel import DispatcherModel


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
                dispatcher_model_json: str = self.queue.get()
                if not isinstance(dispatcher_model_json, str):
                    raise TypeError
            except Exception:
                continue

            if dispatcher_model_json == "EOF":
                self.queue.close()
                break

            try:
                model = DispatcherModel.model_validate_json(dispatcher_model_json)
                consumer = self.__consumers.get(model.event, None)
                if not consumer:
                    raise NameError

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
