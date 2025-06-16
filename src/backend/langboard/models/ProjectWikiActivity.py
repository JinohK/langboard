from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import EnumLikeType, SnowflakeIDField
from ..core.types import SnowflakeID
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
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, index=True)
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki, index=True)
    activity_type: ProjectWikiActivityType = Field(nullable=False, sa_type=EnumLikeType(ProjectWikiActivityType))

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseActivityModel.api_schema(
            {
                "activity_type": f"Literal[{', '.join([activity_type.value for activity_type in ProjectWikiActivityType])}]",
                "filterable_type": "Literal[project]",
                "filterable_uid": "string",
                "sub_filterable_type": "Literal[project_wiki]",
                "sub_filterable_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        base_api_response = super().api_response()
        base_api_response["activity_type"] = self.activity_type.value
        base_api_response["filterable_type"] = "project"
        base_api_response["filterable_uid"] = self.project_id.to_short_code()
        base_api_response["sub_filterable_type"] = "project_wiki"
        base_api_response["sub_filterable_uid"] = self.project_wiki_id.to_short_code()
        return base_api_response
