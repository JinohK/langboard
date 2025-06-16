from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, SnowflakeIDField
from ..core.types import SnowflakeID
from .Checkitem import Checkitem, CheckitemStatus


class CheckitemTimerRecord(BaseSqlModel, table=True):
    checkitem_id: SnowflakeID = SnowflakeIDField(foreign_key=Checkitem, nullable=False, index=True)
    status: CheckitemStatus = Field(nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["checkitem_id", "status", "created_at"]
