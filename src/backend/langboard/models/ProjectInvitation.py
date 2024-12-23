from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Project import Project


class ProjectInvitation(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    email: str = Field(nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
