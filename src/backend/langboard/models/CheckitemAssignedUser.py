from typing import Any
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User
from .Checkitem import Checkitem


class CheckitemAssignedUser(BaseSqlModel, table=True):
    checkitem_id: SnowflakeID = SnowflakeIDField(foreign_key=Checkitem.expr("id"), nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["checkitem_id", "user_id"]
