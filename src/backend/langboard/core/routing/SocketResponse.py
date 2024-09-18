from typing import Any
from pydantic import BaseModel, Field


class SocketResponse(BaseModel):
    """Socket response model."""

    event: str = Field(...)
    data: Any = Field(default=None)
