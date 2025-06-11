from datetime import datetime
from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField, SnowflakeID, SnowflakeIDField
from ..core.utils.DateTime import now
from .Project import Project
from .User import User


class ProjectAssignedUser(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    starred: bool = Field(default=False, nullable=False)
    last_viewed_at: datetime = DateTimeField(default=now, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "user_id", "starred", "last_viewed_at"]
