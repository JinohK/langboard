from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel


class GlobalCardRelationshipType(BaseSqlModel, table=True):
    parent_icon: str | None = Field(default=None, nullable=True)
    parent_name: str = Field(nullable=False)
    child_icon: str | None = Field(default=None, nullable=True)
    child_name: str = Field(nullable=False)
    description: str | None = Field(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "parent_icon": self.parent_icon,
            "parent_name": self.parent_name,
            "child_icon": self.child_icon,
            "child_name": self.child_name,
            "description": self.description or "",
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["parent_icon", "parent_name", "child_icon", "child_name"]
