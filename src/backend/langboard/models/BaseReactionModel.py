from abc import abstractmethod
from typing import Any
from sqlmodel import Field
from ..core.ai import Bot
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User


class BaseReactionModel(BaseSqlModel):
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True, index=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=True, index=True)
    reaction_type: str = Field(nullable=False)

    @staticmethod
    @abstractmethod
    def get_target_column_name() -> str: ...

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
