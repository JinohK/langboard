from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScheduleModel
from .ProjectColumn import ProjectColumn


class ProjectColumnBotSchedule(BaseBotScheduleModel, table=True):
    project_column_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectColumn, nullable=False, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseBotScheduleModel.api_schema(
            {
                "project_column_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        return {
            "project_column_uid": self.project_column_id.to_short_code(),
            **(super().api_response()),
        }
