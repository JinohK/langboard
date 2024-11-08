from sqlmodel import Field
from ..core.db import BaseSqlModel
from .Task import Task
from .User import User


class TaskAssignedUser(BaseSqlModel, table=True):
    task_id: int = Field(foreign_key=Task.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["task_id", "user_id"]
