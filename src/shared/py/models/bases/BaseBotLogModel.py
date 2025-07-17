from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from ..BotLog import BotLog


class BaseBotLogModel(BaseSqlModel):
    bot_log_id: SnowflakeID = SnowflakeIDField(foreign_key=BotLog, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "filterable_table?": "string",
            "filterable_uid?": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["bot_log_id"]
        keys.extend([field for field in self.model_fields if field not in BaseBotLogModel.model_fields])
        return keys
