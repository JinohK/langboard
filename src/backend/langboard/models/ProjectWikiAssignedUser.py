from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .ProjectWiki import ProjectWiki
from .User import User


class ProjectWikiAssignedUser(BaseSqlModel, table=True):
    project_wiki_id: int = Field(foreign_key=ProjectWiki.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_wiki_id", "user_id"]
