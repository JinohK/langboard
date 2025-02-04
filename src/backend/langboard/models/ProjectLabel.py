from typing import Any, ClassVar
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Project import Project


class ProjectLabel(BaseSqlModel, table=True):
    # TODO: Label, should change default labels
    DEFAULT_LABELS: ClassVar[list[dict[str, str]]] = [
        {"name": "To Do", "color": "#4A90E2", "description": "Tasks that need to be done."},
        {"name": "In Progress", "color": "#FF7F32", "description": "Tasks that are currently being worked on."},
        {"name": "Done", "color": "#4CAF50", "description": "Tasks that are completed."},
        {"name": "Testing", "color": "#FFEB3B", "description": "Tasks that are being tested."},
        {"name": "Blocked", "color": "#9C27B0", "description": "Tasks that are blocked."},
        {"name": "Other", "color": "#9E9E9E", "description": "Tasks that don't fit in any other category."},
        {"name": "Artifact", "color": "#00BCD4", "description": "Tasks that are artifacts of the project."},
        {"name": "Error", "color": "#F44336", "description": "Tasks that are errors."},
        {"name": "Fixing", "color": "#388E3C", "description": "Tasks that are being fixed."},
        {"name": "Fetch", "color": "#1DE9B6", "description": "Tasks that are fetching data."},
    ]
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=True)
    name: str = Field(nullable=False)
    color: str = Field(nullable=False)
    description: str = Field(nullable=False)
    order: int = Field(default=0, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "name": self.name,
            "description": self.description,
            "order": self.order,
            "color": self.color,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "bot_id", "name", "color", "order"]
