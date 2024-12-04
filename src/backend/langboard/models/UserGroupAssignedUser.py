from sqlmodel import Field
from ..core.db import BaseSqlModel
from .User import User
from .UserGroup import UserGroup


class UserGroupAssignedUser(BaseSqlModel, table=True):
    group_id: int = Field(foreign_key=UserGroup.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["group_id", "user_id"]
