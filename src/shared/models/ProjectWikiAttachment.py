from typing import Any
from core.db import ModelColumnType, SnowflakeIDField, SoftDeleteModel
from core.storage import FileModel
from core.types import SnowflakeID
from sqlmodel import Field
from .ProjectWiki import ProjectWiki
from .User import User


class ProjectWikiAttachment(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki, nullable=False, index=True)
    filename: str = Field(nullable=False)
    file: FileModel = Field(sa_type=ModelColumnType(FileModel))
    order: int = Field(default=0)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "name": "string",
            "url": "string",
            "order": "integer",
            "created_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.filename,
            "url": self.file.path,
            "order": self.order,
            "created_at": self.created_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "wiki_id", "filename", "file"]
