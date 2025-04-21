from typing import Any
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Project import Project


class ProjectAssignedBot(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=False, index=True)
    is_disabled: bool = Field(default=False, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
