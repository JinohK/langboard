from datetime import datetime
from enum import Enum
from typing import Any, ClassVar
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField, EnumLikeType, SnowflakeID, SnowflakeIDField
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
    target_table: str = Field(nullable=False)
    target_id: SnowflakeID = SnowflakeIDField(nullable=False)
    filterable_table: str | None = Field(None, nullable=True)
    filterable_id: SnowflakeID | None = SnowflakeIDField(nullable=True)
    interval_str: str = Field(nullable=False)
    start_at: datetime | None = DateTimeField(default=None, nullable=True)
    end_at: datetime | None = DateTimeField(default=None, nullable=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "bot_uid": "string",
            "running_type": f"Literal[{', '.join([running_type.value for running_type in BotScheduleRunningType])}]",
            "status": f"Literal[{', '.join([status.value for status in BotScheduleStatus])}]",
            "target_table": "string",
            "target_uid": "string",
            "filterable_table": "string",
            "filterable_uid": "string",
            "interval_str": "string",
            "start_at": "string?",
            "end_at": "string?",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "bot_uid": self.bot_id.to_short_code(),
            "running_type": self.running_type.value,
            "status": self.status.value,
            "target_table": self.target_table,
            "target_uid": self.target_id.to_short_code(),
            "filterable_table": self.filterable_table,
            "filterable_uid": self.filterable_id.to_short_code() if self.filterable_id else None,
            "interval_str": self.interval_str,
            "start_at": self.start_at,
            "end_at": self.end_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return [
            "bot_id",
            "running_type",
            "status",
            "target_table",
            "target_id",
            "filterable_table",
            "filterable_id",
            "interval_str",
            "start_at",
            "end_at",
        ]
