from pydantic import BaseModel


class DispatcherModel(BaseModel):
    event: str
    data: dict
