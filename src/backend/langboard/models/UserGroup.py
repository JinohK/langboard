from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User


class UserGroup(BaseSqlModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    name: str = Field(nullable=False)
    order: int = Field(nullable=False, default=0)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "name": "string",
            "order": "integer",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "order": self.order,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name", "order"]
