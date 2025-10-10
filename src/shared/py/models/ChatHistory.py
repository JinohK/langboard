from typing import Any
from core.db import ChatContentModel, ModelColumnType, SnowflakeIDField, SoftDeleteModel
from core.types import SnowflakeID
from sqlmodel import Field
from .ChatSession import ChatSession


class ChatHistory(SoftDeleteModel, table=True):
    chat_session_id: SnowflakeID = SnowflakeIDField(foreign_key=ChatSession, index=True)
    message: ChatContentModel = Field(default=ChatContentModel(), sa_type=ModelColumnType(ChatContentModel))
    is_received: bool = Field(default=False, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "chat_session_uid": "string",
            "message": ChatContentModel.api_schema(),
            "is_received": "bool",
            "updated_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "chat_session_uid": self.chat_session_id.to_short_code(),
            "message": self.message.model_dump(),
            "is_received": self.is_received,
            "updated_at": self.updated_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["chat_session_id", "message", "is_received"]
