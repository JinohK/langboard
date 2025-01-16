from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel, User
from .Card import Card
from .Checklist import Checklist


class CheckitemStatus(Enum):
    Started = "started"
    Paused = "paused"
    Stopped = "stopped"


class Checkitem(SoftDeleteModel, table=True):
    checklist_id: SnowflakeID = SnowflakeIDField(foreign_key=Checklist.expr("id"), nullable=False)
    cardified_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=True)
    user_id: SnowflakeID | None = SnowflakeIDField(foreign_key=User.expr("id"), nullable=True, index=True)
    title: str = Field(nullable=False)
    status: CheckitemStatus = Field(default=CheckitemStatus.Stopped, nullable=False)
    order: int = Field(default=0, nullable=False)
    accumulated_seconds: int = Field(default=0, nullable=False)
    is_checked: bool = Field(default=False, nullable=False)

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
