from typing import Any
from core.db import BaseSqlModel, SnowflakeIDField
from core.types import SnowflakeID
from sqlalchemy import JSON
from sqlmodel import Field
from ..Bot import Bot
from ..User import User


class BaseActivityModel(BaseSqlModel):
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True)
    bot_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Bot, nullable=True)
    activity_history: dict[str, Any] = Field(default={}, sa_type=JSON)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "activity_history": "object",
            "created_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        response = {
            "uid": self.get_uid(),
            "activity_history": {**self.activity_history},
            "created_at": self.created_at,
        }

        if "record_ids" in self.activity_history:
            record_ids = response["activity_history"].pop("record_ids")
            for record_id, dict_key in record_ids:
                if dict_key not in response["activity_history"]:
                    response["activity_history"][dict_key] = {}
                response["activity_history"][dict_key]["uid"] = SnowflakeID(record_id).to_short_code()

        return response

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
