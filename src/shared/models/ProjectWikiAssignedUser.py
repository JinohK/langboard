from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from .ProjectAssignedUser import ProjectAssignedUser
from .ProjectWiki import ProjectWiki
from .User import User


class ProjectWikiAssignedUser(BaseSqlModel, table=True):
    project_assigned_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectAssignedUser, nullable=False, index=True)
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki, nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_assigned_id", "project_wiki_id", "user_id"]
