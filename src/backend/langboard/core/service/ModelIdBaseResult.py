from typing import Generic, TypeVar


_TData = TypeVar("_TData")


class ModelIdBaseResult(Generic[_TData]):
    model_id: str
    data: _TData

    def __init__(self, model_id: str, data: _TData):
        self.model_id = model_id
        self.data = data
