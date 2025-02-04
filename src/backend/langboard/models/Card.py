from datetime import datetime
from typing import Any
from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import DateTimeField, EditorContentModel, ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Project import Project
from .ProjectColumn import ProjectColumn


class Card(SoftDeleteModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    project_column_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectColumn.expr("id"), nullable=False, index=True)
    title: str = Field(nullable=False)
    description: EditorContentModel | None = Field(default=None, sa_type=ModelColumnType(EditorContentModel))
    ai_description: str | None = Field(default=None, sa_type=TEXT)
    deadline_at: datetime | None = DateTimeField(default=None, nullable=True)
    order: int = Field(default=0, nullable=False)
    archived_at: datetime | None = DateTimeField(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "column_uid": self.project_column_id.to_short_code(),
            "title": self.title,
            "description": self.description.model_dump() if self.description else None,
            "ai_description": self.ai_description,
            "order": self.order,
            "deadline_at": self.deadline_at if self.deadline_at else None,
            "created_at": self.created_at,
            "archived_at": self.archived_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "project_column_id", "title", "deadline_at", "order", "archived_at"]
