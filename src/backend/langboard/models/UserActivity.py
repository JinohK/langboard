from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField
from .BaseActivityModel import BaseActivityModel


class UserActivityType(Enum):
    Activated = "activated"
    DeclinedProjectInvitation = "declined_project_invitation"


class UserActivity(BaseActivityModel, table=True):
    activity_type: UserActivityType | None = Field(default=None, nullable=True)
    refer_activity_table: str | None = Field(default=None, nullable=True)
    refer_activity_id: SnowflakeID | None = SnowflakeIDField(nullable=True)

    def api_response(self) -> dict[str, Any]:
        base_api_response = super().api_response()
        base_api_response["activity_type"] = self.activity_type.value if self.activity_type else None
        base_api_response["filterable_type"] = "user"
        base_api_response["filterable_uid"] = self.get_uid()
        return base_api_response
