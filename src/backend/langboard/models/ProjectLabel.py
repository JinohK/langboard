from typing import Any, ClassVar
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Project import Project


class ProjectLabel(BaseSqlModel, table=True):
    DEFAULT_LABELS: ClassVar[list[dict[str, str]]] = [
        {"name": "To Do", "color": "#4A90E2"},
        {"name": "In Progress", "color": "#FF7F32"},
        {"name": "Done", "color": "#4CAF50"},
        {"name": "Testing", "color": "#FFEB3B"},
        {"name": "Blocked", "color": "#9C27B0"},
        {"name": "Other", "color": "#9E9E9E"},
        {"name": "Artifact", "color": "#00BCD4"},
        {"name": "Error", "color": "#F44336"},
        {"name": "Fixing", "color": "#388E3C"},
        {"name": "Fetch", "color": "#1DE9B6"},
    ]
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False)
    name: str = Field(nullable=False)
    color: str = Field(nullable=False)
    is_bot: bool = Field(default=False, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "color": self.color,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "name", "color", "is_bot"]
