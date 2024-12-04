from typing import Any
from sqlmodel import Field
from ..core.db import ModelColumnType, SoftDeleteModel
from ..core.storage import FileModel
from ..core.utils.String import create_short_unique_id
from .Card import Card
from .User import User


class CardAttachment(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    card_uid: str = Field(foreign_key=Card.expr("uid"), nullable=False)
    filename: str = Field(nullable=False)
    file: FileModel = Field(sa_type=ModelColumnType(FileModel))
    order: int = Field(default=0)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "name": self.filename,
            "url": self.file.path,
            "order": self.order,
            "created_at": self.created_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "user_id", "card_uid", "filename", "file"]
