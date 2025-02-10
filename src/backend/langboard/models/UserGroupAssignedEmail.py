from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .UserGroup import UserGroup


class UserGroupAssignedEmail(BaseSqlModel, table=True):
    group_id: SnowflakeID = SnowflakeIDField(foreign_key=UserGroup.expr("id"), nullable=False, index=True)
    email: str = Field(nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["group_id", "email"]
