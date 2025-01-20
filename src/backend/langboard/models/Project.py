from typing import Any
from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel, User


class Project(SoftDeleteModel, table=True):
    owner_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)
    title: str = Field(nullable=False)
    description: str | None = Field(default=None, sa_type=TEXT)
    ai_description: str | None = Field(default=None, sa_type=TEXT)
    project_type: str = Field(default="Other", nullable=False)
    archive_column_name: str = Field(default="Archive", nullable=False)
    archive_column_order: int = Field(default=0, nullable=False)

    def ARCHIVE_COLUMN_ID(self) -> SnowflakeID:
        return self.id

    def ARCHIVE_COLUMN_UID(self) -> str:
        return self.get_uid()

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
            "project_type": self.project_type,
            "updated_at": self.updated_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["title", "project_type", "archive_column_name", "archive_column_order"]
