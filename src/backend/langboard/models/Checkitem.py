from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeIDField, SoftDeleteModel
from ..core.types import SnowflakeID
from .Card import Card
from .Checklist import Checklist
from .User import User


class CheckitemStatus(Enum):
    Started = "started"
    Paused = "paused"
    Stopped = "stopped"


class Checkitem(SoftDeleteModel, table=True):
    checklist_id: SnowflakeID = SnowflakeIDField(foreign_key=Checklist, nullable=False, index=True)
    cardified_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Card, nullable=True)
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User, nullable=True, index=True)
    title: str = Field(nullable=False)
    status: CheckitemStatus = Field(default=CheckitemStatus.Stopped, nullable=False)
    order: int = Field(default=0, nullable=False)
    accumulated_seconds: int = Field(default=0, nullable=False)
    is_checked: bool = Field(default=False, nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "checklist_uid": "string",
            "title": "string",
            "status": f"Literal[{', '.join([status.value for status in CheckitemStatus])}]",
            "order": "integer",
            "accumulated_seconds": "integer",
            "is_checked": "bool",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "checklist_uid": self.checklist_id.to_short_code(),
            "title": self.title,
            "status": self.status.value,
            "order": self.order,
            "accumulated_seconds": self.accumulated_seconds,
            "is_checked": self.is_checked,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return [
            "checklist_id",
            "cardified_id",
            "user_id",
            "title",
            "status",
            "order",
            "accumulated_seconds",
            "is_checked",
        ]
