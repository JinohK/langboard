from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotLogModel
from .Card import Card


class CardBotLog(BaseBotLogModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "filterable_table": "card",
            "filterable_uid": self.card_id.to_short_code(),
            **(super().api_response()),
        }
