from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .BaseMetadataModel import BaseMetadataModel
from .ProjectWiki import ProjectWiki


class ProjectWikiMetadata(BaseMetadataModel, table=True):
    project_wiki_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectWiki, index=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return BaseMetadataModel.api_schema({"project_wiki_uid": "string"})

    def api_response(self) -> dict[str, Any]:
        return {
            "project_wiki_uid": self.project_wiki_id.to_short_code(),
            **(super().api_response()),
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_wiki_id", "key"]
