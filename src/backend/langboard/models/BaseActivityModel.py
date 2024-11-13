from enum import Enum
from typing import Any
from sqlalchemy import JSON
from sqlmodel import Field
from ..core.ai import BotType
from ..core.db import BaseSqlModel
from .User import User


class ActivityType(Enum):
    GroupCreated = "group.created"
    GroupAssignedUser = "group.assigned_user"
    ProjectCreated = "project.created"
    ProjectUpdated = "project.updated"
    ProjectAssignedUser = "project.assigned_user"
    ProjectUnassignedUser = "project.unassigned_user"
    ProjectAssignedGroup = "project.assigned_group"
    ProjectUnassignedGroup = "project.unassigned_group"
    ProjectColumnChangedOrder = "project.column_changed_order"
    TaskCreated = "task.created"
    TaskChangedColumn = "task.changed_column"


class BaseActivityModel(BaseSqlModel):
    activity: dict[str, Any] = Field(default={}, sa_type=JSON)
    activity_type: ActivityType = Field(nullable=False)
    user_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    bot_type: BotType | None = Field(default=None, nullable=True)

    def get_filterable_columns(self) -> list[str]:
        if not isinstance(self, BaseActivityModel) and (
            not isinstance(self, type) or not issubclass(self, BaseActivityModel)
        ):
            return []

        return [field for field in self.model_fields if field not in BaseActivityModel.model_fields]

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["activity_type", "user_id"]
        keys.extend(self.get_filterable_columns())
        return keys
