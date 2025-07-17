from enum import Enum
from typing import Any
from core.db import EnumLikeType, SnowflakeIDField
from core.types import SnowflakeID
from sqlmodel import Field
from .bases import BaseActivityModel


class UserActivityType(Enum):
    Activated = "activated"
    DeclinedProjectInvitation = "declined_project_invitation"


class UserActivity(BaseActivityModel, table=True):
    activity_type: UserActivityType | None = Field(default=None, nullable=True, sa_type=EnumLikeType(UserActivityType))
    refer_activity_table: str | None = Field(default=None, nullable=True)
    refer_activity_id: SnowflakeID | None = SnowflakeIDField(nullable=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseActivityModel.api_schema(
            {
                "activity_type": f"Literal[{', '.join([activity_type.value for activity_type in UserActivityType])}]?",
                "filterable_type": "Literal[user]",
                "filterable_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        base_api_response = super().api_response()
        base_api_response["activity_type"] = self.activity_type.value if self.activity_type else None
        base_api_response["filterable_type"] = "user"
        if self.user_id:
            base_api_response["filterable_uid"] = self.user_id.to_short_code()
        elif self.bot_id:
            base_api_response["filterable_uid"] = self.bot_id.to_short_code()
        else:
            base_api_response["filterable_uid"] = self.get_uid()
        return base_api_response
