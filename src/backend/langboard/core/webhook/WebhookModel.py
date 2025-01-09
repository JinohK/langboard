from typing import Any
from pydantic import BaseModel


class WebhookModel(BaseModel):
    event: str
    event_data: dict[str, Any]
