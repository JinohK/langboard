from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScheduleModel
from .Card import Card


class CardBotSchedule(BaseBotScheduleModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseBotScheduleModel.api_schema(
            {
                "card_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        return {
            "card_uid": self.card_id.to_short_code(),
            **(super().api_response()),
        }
