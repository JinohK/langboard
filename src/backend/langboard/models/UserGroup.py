from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User


class UserGroup(BaseSqlModel, table=True):
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)
    name: str = Field(nullable=False)
    order: int = Field(nullable=False, default=0)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name", "order"]
