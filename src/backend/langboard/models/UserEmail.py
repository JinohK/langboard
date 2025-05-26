from datetime import datetime
from typing import Any
from sqlmodel import Field
from ..core.db import DateTimeField, SnowflakeID, SnowflakeIDField, SoftDeleteModel, User


class UserEmail(SoftDeleteModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    email: str = Field(nullable=False)
    verified_at: datetime | None = DateTimeField(default=None, nullable=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "email": "string",
            "verified_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "email": self.email,
            "verified_at": self.verified_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "email", "verified_at"]
