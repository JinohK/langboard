from typing import Any, cast, overload
from pydantic import BaseModel
from ..utils.decorators import class_instance, thread_safe_singleton
from .BaseDispatcherQueue import BaseDispatcherQueue


@class_instance()
@thread_safe_singleton
class DispatcherQueue(BaseDispatcherQueue):
    @property
    def is_closed(self) -> bool:
        if not self.__instance:
            return True
        return self.__instance.is_closed

    def __init__(self):
        self.__instance: BaseDispatcherQueue = cast(BaseDispatcherQueue, None)

    def set_queue(self, queue: BaseDispatcherQueue):
        if not isinstance(queue, BaseDispatcherQueue):
            raise TypeError("queue must be an instance of BaseDispatcherQueue")
        self.__instance = queue

    @overload
    async def put(self, event: str, data: dict[str, Any]): ...
    @overload
    async def put(self, event: BaseModel): ...
    async def put(self, event: str | BaseModel, data: dict[str, Any] | None = None):
        if not self.__instance:
            return
        await self.__instance.put(event, data)

    def start(self):
        if not self.__instance:
            return
        self.__instance.start()

    def close(self):
        if not self.__instance:
            return
        self.__instance.close()
