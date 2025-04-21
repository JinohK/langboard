from typing import Any
from sqlmodel import Field
from ..db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Bot import Bot


class BotSchedule(BaseSqlModel, table=True):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot.expr("id"), nullable=False, index=True)
    target_table: str = Field(nullable=False)
    target_id: SnowflakeID = SnowflakeIDField(nullable=False)
    filterable_table: str | None = Field(None, nullable=True)
    filterable_id: SnowflakeID | None = SnowflakeIDField(nullable=True)
    interval_str: str = Field(nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "bot_uid": "string",
            "target_table": "string",
            "target_uid": "string",
            "filterable_table": "string",
            "filterable_uid": "string",
            "interval_str": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "bot_uid": self.bot_id.to_short_code(),
            "target_table": self.target_table,
            "target_uid": self.target_id.to_short_code(),
            "filterable_table": self.filterable_table,
            "filterable_uid": self.filterable_id.to_short_code() if self.filterable_id else None,
            "interval_str": self.interval_str,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "target_table", "target_id", "filterable_table", "filterable_id", "interval_str"]
