from typing import Any
from core.db import DateTimeField, EditorContentModel, ModelColumnType, SnowflakeIDField, SoftDeleteModel
from core.types import SafeDateTime, SnowflakeID
from sqlalchemy import TEXT
from sqlmodel import Field
from .Project import Project
from .ProjectColumn import ProjectColumn


class Card(SoftDeleteModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)
    project_column_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectColumn, nullable=False, index=True)
    title: str = Field(nullable=False)
    description: EditorContentModel = Field(default=EditorContentModel(), sa_type=ModelColumnType(EditorContentModel))
    ai_description: str | None = Field(default=None, sa_type=TEXT)
    deadline_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)
    order: int = Field(default=0, nullable=False)
    archived_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "project_uid": "string",
            "column_uid": "string",
            "title": "string",
            "description": EditorContentModel.api_schema(),
            "ai_description": "string",
            "order": "integer",
            "deadline_at": "string?",
            "created_at": "string",
            "archived_at": "string?",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "column_uid": self.project_column_id.to_short_code(),
            "title": self.title,
            "description": self.description.model_dump(),
            "ai_description": self.ai_description,
            "order": self.order,
            "deadline_at": self.deadline_at,
            "created_at": self.created_at,
            "archived_at": self.archived_at,
        }

    def board_api_response(
        self,
        count_comment: int,
        members: list[dict[str, Any]],
        relationships: list[dict[str, Any]],
        labels: list[dict[str, Any]],
        checklists: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            **self.api_response(),
            "count_comment": count_comment,
            "members": members,
            "relationships": relationships,
            "labels": labels,
            "checklists": checklists,
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "project_column_id", "title", "deadline_at", "order", "archived_at"]
