from typing import Any
from sqlmodel import Field
from ..core.db import ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel, User
from ..core.storage import FileModel
from .Card import Card


class CardAttachment(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)
    filename: str = Field(nullable=False)
    file: FileModel = Field(sa_type=ModelColumnType(FileModel))
    order: int = Field(default=0)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "card_uid": "string",
            "name": "string",
            "url": "string",
            "order": "integer",
            "created_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "card_uid": self.card_id.to_short_code(),
            "name": self.filename,
            "url": self.file.path,
            "order": self.order,
            "created_at": self.created_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "card_id", "filename", "file"]
