from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from ..BotSchedule import BotSchedule


class BaseBotScheduleModel(BaseSqlModel):
    bot_schedule_id: SnowflakeID = SnowflakeIDField(foreign_key=BotSchedule, nullable=False, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["bot_schedule_id"]
        keys.extend([field for field in self.model_fields if field not in BaseBotScheduleModel.model_fields])
        return keys
