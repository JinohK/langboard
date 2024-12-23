from typing import Any
from sqlmodel import Field
from ..core.db import ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel, User
from ..core.storage import FileModel
from .ProjectWiki import ProjectWiki


class ProjectWikiAttachment(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)
    wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki.expr("id"), nullable=False, index=True)
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
        return ["user_id", "wiki_id", "filename", "file"]
