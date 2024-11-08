from typing import Any
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .Project import Project


class ProjectColumn(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)
    name: str = Field(nullable=False)
    order: int = Field(default=1, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "name": self.name,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "project_id", "name", "order"]
