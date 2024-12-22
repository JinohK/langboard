from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel, User


class ChatHistory(SoftDeleteModel, table=True):
    filterable: SnowflakeID | None = SnowflakeIDField(nullable=True)
    sender_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True)
    receiver_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True)
    history_type: str = Field(nullable=False)
    message: str = Field(nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "sender_uid": self.sender_id.to_short_code() if self.sender_id else None,
            "receiver_uid": self.receiver_id.to_short_code() if self.receiver_id else None,
            "message": self.message,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["filterable", "sender_id", "receiver_id", "history_type", "message"]
