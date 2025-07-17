from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotLogModel
from .ProjectColumn import ProjectColumn


class ProjectColumnBotLog(BaseBotLogModel, table=True):
    project_column_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectColumn, nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "filterable_table": "project_column",
            "filterable_uid": self.project_column_id.to_short_code(),
            **(super().api_response()),
        }
