from typing import Any
from core.db import BaseSqlModel, DateTimeField, SnowflakeIDField
from core.types import SafeDateTime, SnowflakeID
from sqlmodel import Field
from .User import User


class ChatSession(BaseSqlModel, table=True):
    filterable_table: str = Field(...)
    filterable_id: SnowflakeID = SnowflakeIDField()
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, index=True)
    title: str = Field(default="", nullable=False)
    last_messaged_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {
            "uid": "string",
            "filterable_table": "string",
            "filterable_uid": "string",
            "user_uid": "string",
            "title": "string",
            "last_messaged_at": "string?",
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "filterable_table": self.filterable_table,
            "filterable_uid": self.filterable_id.to_short_code(),
            "user_uid": self.user_id.to_short_code(),
            "title": self.title,
            "last_messaged_at": self.last_messaged_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["filterable_table", "filterable_id", "user_id", "title", "last_messaged_at"]
