from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from sqlalchemy import TEXT
from sqlmodel import Field


class ChatTemplate(BaseSqlModel, table=True):
    filterable_table: str | None = Field(None, nullable=True)
    filterable_id: SnowflakeID | None = SnowflakeIDField(nullable=True)
    name: str = Field(nullable=False)
    template: str = Field(default="", sa_type=TEXT)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {
            "uid": "string",
            "filterable_table": "string?",
            "filterable_uid": "string?",
            "name": "string",
            "template": "string",
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "filterable_table": self.filterable_table,
            "filterable_uid": self.filterable_id.to_short_code() if self.filterable_id else None,
            "name": self.name,
            "template": self.template,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["filterable_table", "filterable_id", "name"]
