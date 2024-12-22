from typing import Any
from sqlmodel import Field
from ..core.db import ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel, User
from ..core.storage import FileModel
from .Card import Card


class CardAttachment(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False)
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False)
    filename: str = Field(nullable=False)
    file: FileModel = Field(sa_type=ModelColumnType(FileModel))
    order: int = Field(default=0)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.filename,
            "url": self.file.path,
            "order": self.order,
            "created_at": self.created_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "card_id", "filename", "file"]
