from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from .Task import Task
from .User import User


class TaskComment(SoftDeleteModel, table=True):
    task_id: int = Field(foreign_key=Task.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    content: str | None = Field(default=None, sa_type=TEXT, nullable=True)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["task_id", "user_id"]
