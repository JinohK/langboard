from sqlmodel import Field
from ..core.db import BaseSqlModel
from .UserGroup import UserGroup


class UserGroupAssignedEmail(BaseSqlModel, table=True):
    group_id: int = Field(foreign_key=UserGroup.expr("id"), nullable=False)
    email: str = Field(nullable=False)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["group_id", "email"]
