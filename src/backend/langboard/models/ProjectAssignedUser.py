from datetime import datetime
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField, SnowflakeID, SnowflakeIDField, User
from ..core.utils.DateTime import now
from .Project import Project


class ProjectAssignedUser(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False)
    starred: bool = Field(default=False, nullable=False)
    last_viewed_at: datetime = DateTimeField(default=now, nullable=False)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "user_id", "starred", "last_viewed_at"]
