from typing import Any
from sqlmodel import Field
from ..db import BaseSqlModel, EnumLikeType, SnowflakeID, SnowflakeIDField
from .Bot import Bot
from .BotTriggerCondition import BotTriggerCondition


class BotTrigger(BaseSqlModel, table=True):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, nullable=False, index=True)
    condition: BotTriggerCondition = Field(nullable=False, sa_type=EnumLikeType(BotTriggerCondition))
    is_predefined: bool = Field(default=False, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "condition", "is_predefined"]
