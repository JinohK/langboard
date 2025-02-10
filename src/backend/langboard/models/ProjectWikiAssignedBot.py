from typing import Any
from ..core.ai import Bot
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .ProjectAssignedBot import ProjectAssignedBot
from .ProjectWiki import ProjectWiki


class ProjectWikiAssignedBot(BaseSqlModel, table=True):
    project_assigned_id: SnowflakeID = SnowflakeIDField(
        foreign_key=ProjectAssignedBot.expr("id"), nullable=False, index=True
    )
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki.expr("id"), nullable=False, index=True)
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=False, index=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_assigned_id", "project_wiki_id", "bot_id"]
