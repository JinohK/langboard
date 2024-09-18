from pydantic import BaseModel, Field


class WebSocketOptions(BaseModel):
    compression: bool = Field(default=False)
    max_payload_length: int = Field(default=16 * 1024 * 1024)
    idle_timeout: int = Field(default=20)
    send_pings_automatically: bool = Field(default=True)
    reset_idle_timeout_on_send: bool = Field(default=True)
    max_lifetime: int = Field(default=0)
    max_backpressure: int = Field(default=16 * 1024 * 1024)
    close_on_backpressure_limit: bool = Field(default=False)
