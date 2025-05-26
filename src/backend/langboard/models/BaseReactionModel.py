from abc import abstractmethod
from typing import Any
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User


REACTION_TYPES = [
    "check-mark",
    "confusing",
    "eyes",
    "heart",
    "laughing",
    "party-popper",
    "rocket",
    "thumbs-down",
    "thumbs-up",
]


class BaseReactionModel(BaseSqlModel):
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot, nullable=True)
    reaction_type: str = Field(nullable=False)

    @staticmethod
    @abstractmethod
    def get_target_column_name() -> str: ...

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
