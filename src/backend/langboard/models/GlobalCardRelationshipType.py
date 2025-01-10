from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel


class GlobalCardRelationshipType(BaseSqlModel, table=True):
    parent_name: str = Field(nullable=False)
    child_name: str = Field(nullable=False)
    description: str = Field(default="", nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "parent_name": self.parent_name,
            "child_name": self.child_name,
            "description": self.description,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["parent_name", "child_name"]
