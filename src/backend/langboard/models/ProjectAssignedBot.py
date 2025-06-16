from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeIDField
from ..core.types import SnowflakeID
from .Bot import Bot
from .Project import Project


class ProjectAssignedBot(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, nullable=False, index=True)
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
