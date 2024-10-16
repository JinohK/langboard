from sqlmodel import Field
from ..core.db import BaseSqlModel
from .Group import Group
from .User import User


class GroupAssignedUser(BaseSqlModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    group_id: int = Field(foreign_key=Group.expr("id"), nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "group_id"]
