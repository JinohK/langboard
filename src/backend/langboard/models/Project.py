from typing import Any
from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel, User


class Project(SoftDeleteModel, table=True):
    owner_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    title: str = Field(nullable=False)
    description: str | None = Field(default=None, sa_type=TEXT)
    ai_description: str | None = Field(default=None, sa_type=TEXT)
    project_type: str = Field(default="Other", nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "title": "string",
            "project_type": "string",
            "updated_at": "string",
            **(schema or {}),
        }

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
        return ["owner_id", "title", "project_type"]
