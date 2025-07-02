from typing import Any
from core.db import BaseSqlModel
from sqlmodel import Field


class GlobalCardRelationshipType(BaseSqlModel, table=True):
    parent_name: str = Field(nullable=False)
    child_name: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "parent_name": "string",
            "child_name": "string",
            "description": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "parent_name": self.parent_name,
            "child_name": self.child_name,
            "description": self.description,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["parent_name", "child_name"]
