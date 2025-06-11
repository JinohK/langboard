from typing import Any
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Card import Card
from .ProjectAssignedUser import ProjectAssignedUser
from .User import User


class CardAssignedUser(BaseSqlModel, table=True):
    project_assigned_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectAssignedUser, nullable=False, index=True)
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_assigned_id", "card_id", "user_id"]
