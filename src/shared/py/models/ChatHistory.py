from typing import Any
from core.db import ChatContentModel, ModelColumnType, SnowflakeIDField, SoftDeleteModel
from core.types import SnowflakeID
from sqlmodel import Field
from .User import User


class ChatHistory(SoftDeleteModel, table=True):
    filterable_table: str = Field(...)
    filterable_id: SnowflakeID = SnowflakeIDField()
    sender_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True)
    receiver_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True)
    message: ChatContentModel = Field(default=ChatContentModel(), sa_type=ModelColumnType(ChatContentModel))

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "filterable_table": "string",
            "filterable_uid": "string",
            "sender_uid": "string",
            "receiver_uid": "string",
            "message": ChatContentModel.api_schema(),
            "updated_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "filterable_table": self.filterable_table,
            "filterable_uid": self.filterable_id.to_short_code(),
            "sender_uid": self.sender_id.to_short_code() if self.sender_id else None,
            "receiver_uid": self.receiver_id.to_short_code() if self.receiver_id else None,
            "message": self.message.model_dump(),
            "updated_at": self.updated_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["filterable_table", "filterable_id", "sender_id", "receiver_id", "message"]
