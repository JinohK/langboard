from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from sqlalchemy import Text
from sqlmodel import Field
from .InternalBot import InternalBot
from .Project import Project


class ProjectAssignedInternalBot(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)
    internal_bot_id: SnowflakeID = SnowflakeIDField(foreign_key=InternalBot, nullable=False, index=True)
    prompt: str = Field(default="", nullable=False, sa_type=Text)
    use_default_prompt: bool = Field(default=True, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {
            "prompt": "string",
            "use_default_prompt": "bool",
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "prompt": self.prompt,
            "use_default_prompt": self.use_default_prompt,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
