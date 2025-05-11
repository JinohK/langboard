from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel


class BaseMetadataModel(BaseSqlModel):
    key: str = Field(nullable=False, index=True)
    value: str = Field(default="", nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "key": "string",
            "value": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "key": self.key,
            "value": self.value,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
