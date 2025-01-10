from enum import Enum
from typing import Any, TypeVar
from pydantic import BaseModel
from ..broadcast import DispatcherModel, DispatcherQueue
from ..utils.decorators import staticclass


_TModel = TypeVar("_TModel")
_TData = TypeVar("_TData")


class SocketPublishModel(BaseModel):
    topic: Enum | str
    topic_id: str
    event: str
    data_keys: list[str] | str | None = None
    custom_data: dict[str, Any] | None = None


class SocketPublishQueueModel(BaseModel):
    data: dict[str, Any]
    publish_models: list[SocketPublishModel] | SocketPublishModel


@staticclass
class SocketPublishService:
    @staticmethod
    def put_dispather(data: dict[str, Any], publish_models: list[SocketPublishModel] | SocketPublishModel):
        model = SocketPublishQueueModel(data=data, publish_models=publish_models)
        dispatacher_model = DispatcherModel(event="socket_publish", data=model.model_dump())
        DispatcherQueue.put(dispatacher_model)

    @staticmethod
    def parse(dispatcher_data: dict[str, Any]):
        model = SocketPublishQueueModel(**dispatcher_data)
        return model
