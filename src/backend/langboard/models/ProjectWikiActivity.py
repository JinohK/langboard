from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField
from .BaseActivityModel import BaseActivityModel
from .Project import Project
from .ProjectWiki import ProjectWiki


class ProjectWikiActivityType(Enum):
    WikiCreated = "wiki_created"
    WikiUpdated = "wiki_updated"
    WikiPublicityChanged = "wiki_publicity_changed"
    WikiAssigneesUpdated = "wiki_assignees_updated"
    WikiDeleted = "wiki_deleted"


class ProjectWikiActivity(BaseActivityModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), index=True)
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki.expr("id"), index=True)
    activity_type: ProjectWikiActivityType = Field(nullable=False)

    def api_response(self) -> dict[str, Any]:
        base_api_response = super().api_response()
        base_api_response["activity_type"] = self.activity_type.value
        base_api_response["filterable_type"] = "project"
        base_api_response["filterable_uid"] = self.project_id.to_short_code()
        base_api_response["sub_filterable_type"] = "project_wiki"
        base_api_response["sub_filterable_uid"] = self.project_wiki_id.to_short_code()
        return base_api_response
