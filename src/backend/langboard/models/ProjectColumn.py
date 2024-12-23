from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Project import Project


class ProjectColumn(SoftDeleteModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    name: str = Field(nullable=False)
    order: int = Field(default=1, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "name", "order"]
