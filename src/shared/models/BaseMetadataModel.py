from typing import Any
from core.db import BaseSqlModel
from sqlalchemy import TEXT
from sqlmodel import Field


class BaseMetadataModel(BaseSqlModel):
    key: str = Field(nullable=False, index=True)
    value: str = Field(default="", nullable=False, sa_type=TEXT)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "key": "string",
            "value": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "value": self.value,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
