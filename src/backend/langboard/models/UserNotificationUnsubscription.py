from enum import Enum
from typing import Any, ClassVar
from sqlmodel import Field
from ..core.db import BaseSqlModel, EnumLikeType, SnowflakeIDField
from ..core.types import SnowflakeID
from .User import User
from .UserNotification import NotificationType


class NotificationChannel(Enum):
    Web = "web"
    Email = "email"
    Mobile = "mobile"
    IoT = "iot"


class NotificationScope(Enum):
    All = "all"
    Specific = "specific"


class UserNotificationUnsubscription(BaseSqlModel, table=True):
    UNAVAILABLE_TYPES: ClassVar[list[NotificationType]] = [NotificationType.ProjectInvited]
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User, nullable=False, index=True)
    channel: NotificationChannel = Field(nullable=False, sa_type=EnumLikeType(NotificationChannel))
    notification_type: NotificationType = Field(nullable=False, sa_type=EnumLikeType(NotificationType))
    scope_type: NotificationScope = Field(nullable=False, sa_type=EnumLikeType(NotificationScope))
    specific_table: str | None = Field(nullable=True)
    specific_id: SnowflakeID | None = SnowflakeIDField(nullable=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
