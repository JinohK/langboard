from enum import Enum
from typing import Any, Generic, TypeVar
from pydantic import BaseModel


_TData = TypeVar("_TData")


class SocketPublishModel(BaseModel):
    topic: Enum | str
    topic_id: str
    event: str
    data_keys: list[str] | str | None = None
    extra_data: dict[str, Any] | None = None


class SocketModelIdBaseResult(Generic[_TData]):
    model_id: str
    data: _TData
    publish_models: list[SocketPublishModel] | SocketPublishModel

    def __init__(self, model_id: str, data: _TData, publish_models: list[SocketPublishModel] | SocketPublishModel):
        self.model_id = model_id
        self.data = data
        self.publish_models = publish_models
