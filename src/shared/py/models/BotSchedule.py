from enum import Enum
from typing import Any, ClassVar
from core.db import BaseSqlModel, DateTimeField, EnumLikeType, SnowflakeIDField
from core.types import SafeDateTime, SnowflakeID
from sqlmodel import Field
from .Bot import Bot


class BotScheduleRunningType(Enum):
    Infinite = "infinite"
    Duration = "duration"
    Reserved = "reserved"
    Onetime = "onetime"


class BotScheduleStatus(Enum):
    Pending = "pending"  # The schedule is pending and not yet started (BotScheduleRunningType.Duration, BotScheduleRunningType.Reserved, BotScheduleRunningType.Onetime)
    Started = "started"  # The schedule is started and running (BotScheduleRunningType.Infinite, BotScheduleRunningType.Duration, BotScheduleRunningType.Reserved)
    Stopped = "stopped"  # The schedule is stopped and not running (BotScheduleRunningType.Infinite, BotScheduleRunningType.Duration, BotScheduleRunningType.Reserved, BotScheduleRunningType.Onetime)


class BotSchedule(BaseSqlModel, table=True):
    RUNNING_TYPES_WITH_START_AT: ClassVar[list[BotScheduleRunningType]] = [
        BotScheduleRunningType.Duration,
        BotScheduleRunningType.Reserved,
        BotScheduleRunningType.Onetime,
    ]
    RUNNING_TYPES_WITH_END_AT: ClassVar[list[BotScheduleRunningType]] = [BotScheduleRunningType.Duration]
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, nullable=False, index=True)
    running_type: BotScheduleRunningType = Field(
        default=BotScheduleRunningType.Infinite, nullable=False, sa_type=EnumLikeType(BotScheduleRunningType)
    )
    status: BotScheduleStatus = Field(nullable=False, sa_type=EnumLikeType(BotScheduleStatus))
    interval_str: str = Field(nullable=False)
    start_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)
    end_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "bot_uid": "string",
            "running_type": f"Literal[{', '.join([running_type.value for running_type in BotScheduleRunningType])}]",
            "status": f"Literal[{', '.join([status.value for status in BotScheduleStatus])}]",
            "interval_str": "string",
            "start_at": "string?",
            "end_at": "string?",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "bot_uid": self.bot_id.to_short_code(),
            "running_type": self.running_type.value,
            "status": self.status.value,
            "interval_str": self.interval_str,
            "start_at": self.start_at,
            "end_at": self.end_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "running_type", "status", "interval_str", "start_at", "end_at"]
