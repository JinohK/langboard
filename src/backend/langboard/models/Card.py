from datetime import datetime
from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import DateTimeField, SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .ProjectColumn import Project, ProjectColumn


class Card(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)
    project_column_uid: str | None = Field(foreign_key=ProjectColumn.expr("uid"), nullable=True)
    title: str = Field(nullable=False)
    description: str = Field(default="", sa_type=TEXT, nullable=True)
    deadline_at: datetime | None = DateTimeField(default=None, nullable=True)
    order: int = Field(default=0, nullable=False)
    archived_at: datetime | None = DateTimeField(default=None, nullable=True)

    def api_response(self):
        return {
            "uid": self.uid,
            "column_uid": self.project_column_uid,
            "title": self.title,
            "description": self.description,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "project_id", "project_column_uid", "title", "deadline_at", "order", "archived_at"]
