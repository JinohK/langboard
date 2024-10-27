from datetime import datetime
from sqlmodel import Field
from ..core.db import BaseSqlModel
from ..core.utils.DateTime import now
from .Project import Project
from .User import User


class ProjectAssignedUser(BaseSqlModel, table=True):
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    starred: bool = Field(default=False, nullable=False)
    last_viewed_at: datetime = Field(default_factory=now, nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "user_id", "starred", "last_viewed_at"]
