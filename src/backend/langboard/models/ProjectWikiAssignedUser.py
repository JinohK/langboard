from typing import Any
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User
from .ProjectWiki import ProjectWiki


class ProjectWikiAssignedUser(BaseSqlModel, table=True):
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki.expr("id"), nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_wiki_id", "user_id"]
