from typing import Any
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import EditorContentModel, ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel, User
from .Card import Card


class CardComment(SoftDeleteModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=True)
    content: EditorContentModel = Field(default=EditorContentModel(), sa_type=ModelColumnType(EditorContentModel))

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "card_uid": "string",
            "content": EditorContentModel.api_schema(),
            "is_edited": "bool",
            "commented_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "card_uid": self.card_id.to_short_code(),
            "content": self.content.model_dump(),
            "is_edited": self.created_at.timestamp() != self.updated_at.timestamp(),
            "commented_at": self.updated_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "content": self.content.model_dump(),
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "user_id", "bot_id"]
