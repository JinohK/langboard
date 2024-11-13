from typing import Any, ClassVar
from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .User import User


class Project(SoftDeleteModel, table=True):
    ARCHIVE_COLUMN_UID: ClassVar[str] = "archive"
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    owner_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    title: str = Field(nullable=False)
    description: str | None = Field(default=None, sa_type=TEXT)
    ai_description: str | None = Field(default=None, sa_type=TEXT)
    project_type: str = Field(default="Other", nullable=False)
    archive_column_name: str = Field(default="Archive", nullable=False)
    archive_column_order: int = Field(default=0, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "title": self.title,
            "project_type": self.project_type,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "title", "project_type", "archive_column_name", "archive_column_order"]
