from typing import Any
from pydantic import BaseModel, Field
from .SocketTopic import SocketTopic


class SocketResponse(BaseModel):
    """Socket response model."""

    topic: str = Field(default=SocketTopic.NoneTopic.value)
    topic_id: str | list[str] | None = Field(default=None)
    event: str = Field(...)
    data: Any = Field(default=None)
