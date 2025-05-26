from datetime import datetime
from pydantic import AwareDatetime, Field
from ....core.ai import BotSchedule, BotScheduleRunningType, BotScheduleStatus
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination
from ....core.utils.DateTime import now
from ....models import Card, ProjectColumn


class BotSchedulePagination(Pagination):
    status: BotScheduleStatus | None = Field(
        default=None, title=f"Status: {', '.join(BotScheduleStatus.__members__.keys())} (Default: None)"
    )
    refer_time: datetime = now()


class BotScheduleSearchForm(Pagination):
    status: BotScheduleStatus | None = Field(
        default=None, title=f"Status: {', '.join(BotScheduleStatus.__members__.keys())} (Default: None)"
    )


@form_model
class CreateBotCronTimeForm(BaseFormModel):
    interval_str: str = Field(..., title="Cron interval string (UNIX crontab format - * * * * *)")
    running_type: BotScheduleRunningType | None = Field(
        default=BotScheduleRunningType.Infinite,
        title=f"Running type: {', '.join(BotScheduleRunningType.__members__.keys())} (Default: {BotScheduleRunningType.Infinite.name})",
    )
    target_table: str = Field(..., title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__})")
    target_uid: str = Field(..., title="Target UID")
    start_at: AwareDatetime | None = Field(
        default=None,
        title=f"Start time (Required if running_type is one of {', '.join([schedule_type.name for schedule_type in BotSchedule.RUNNING_TYPES_WITH_START_AT])})",
    )
    end_at: AwareDatetime | None = Field(
        default=None,
        title=f"End time (Required if running_type is {', '.join([schedule_type.name for schedule_type in BotSchedule.RUNNING_TYPES_WITH_END_AT])})",
    )


@form_model
class UpdateBotCronTimeForm(BaseFormModel):
    interval_str: str | None = Field(default=None, title="Cron interval string (UNIX crontab format - * * * * *)")
    running_type: BotScheduleRunningType | None = Field(
        default=None,
        title=f"Running type: {', '.join(BotScheduleRunningType.__members__.keys())}",
    )
    target_table: str | None = Field(
        default=None,
        title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__})",
    )
    target_uid: str | None = Field(default=None, title="Target UID")
    start_at: AwareDatetime | None = Field(
        default=None,
        title=f"Start time (Required if running_type is one of {', '.join([schedule_type.name for schedule_type in BotSchedule.RUNNING_TYPES_WITH_START_AT])})",
    )
    end_at: AwareDatetime | None = Field(
        default=None,
        title=f"End time (Required if running_type is {', '.join([schedule_type.name for schedule_type in BotSchedule.RUNNING_TYPES_WITH_END_AT])})",
    )
