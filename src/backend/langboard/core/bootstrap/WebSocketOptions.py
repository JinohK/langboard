from pydantic import BaseModel, Field


class WebSocketOptions(BaseModel):
    max_size: int = Field(default=16777216)
    max_queue: int = Field(default=32)
    ping_interval: float | None = Field(default=20.0)
    ping_timeout: float | None = Field(default=20.0)
    per_message_deflate: bool = Field(default=True)
