from datetime import datetime
from enum import Enum
from typing import Any
from sqlalchemy import JSON
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField, SnowflakeID, SnowflakeIDField, User


class NotificationType(Enum):
    ProjectInvited = "project_invited"
    MentionedAtCard = "mentioned_at_card"
    MentionedAtComment = "mentioned_at_comment"
    MentionedAtWiki = "mentioned_at_wiki"
    AssignedToCard = "assigned_to_card"
    ReactedToComment = "reacted_to_comment"
    NotifiedFromChecklist = "notified_from_checklist"


class UserNotification(BaseSqlModel, table=True):
    notifier_type: str = Field(nullable=False)
    notifier_id: SnowflakeID = SnowflakeIDField(nullable=False, index=True)
    receiver_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)
    notification_type: NotificationType = Field(nullable=False)
    message_vars: dict[str, Any] = Field(default={}, sa_type=JSON)
    record_list: list[tuple[str, SnowflakeID, str]] = Field(default=[], sa_type=JSON)
    read_at: datetime | None = DateTimeField(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "type": self.notification_type.value,
            "message_vars": self.message_vars,
            "read_at": self.read_at,
            "created_at": self.created_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["notifier_id", "receiver_id", "notification_type", "read_at"]
