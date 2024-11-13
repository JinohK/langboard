from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .GlobalTaskRelationshipType import GlobalTaskRelationshipType
from .Task import Task


class TaskRelationship(BaseSqlModel, table=True):
    relation_type_id: int = Field(foreign_key=GlobalTaskRelationshipType.expr("id"), nullable=False)
    task_uid_parent: str = Field(foreign_key=Task.expr("uid"), nullable=False, index=True)
    task_uid_child: str = Field(foreign_key=Task.expr("uid"), nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["relation_type_id", "task_uid_parent", "task_uid_child"]
