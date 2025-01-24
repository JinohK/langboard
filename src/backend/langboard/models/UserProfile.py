from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User


class UserProfile(BaseSqlModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), unique=True, nullable=False)
    industry: str = Field(nullable=False)
    purpose: str = Field(nullable=False)
    affiliation: str | None = Field(default=None, nullable=True)
    position: str | None = Field(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "industry": self.industry,
            "purpose": self.purpose,
            "affiliation": self.affiliation,
            "position": self.position,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "industry", "purpose", "affiliation", "position"]
