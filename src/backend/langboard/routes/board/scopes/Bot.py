from datetime import datetime
from pydantic import Field
from ....core.ai import BotScheduleRunningType
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination
from ....core.utils.DateTime import now
from ....models import Card, ProjectColumn


class BotSchedulePagination(Pagination):
    refer_time: datetime = now()


@form_model
class BotCronTimeForm(BaseFormModel):
    interval_str: str | None = Field(
        default=None, title="Cron interval string (UNIX crontab format - * * * * *) (Required for init)"
    )
    running_type: BotScheduleRunningType | None = Field(
        default=None,
        title=f"Running type: {', '.join(BotScheduleRunningType.__members__.keys())} (Default: {BotScheduleRunningType.Infinite})",
    )
    target_table: str | None = Field(
        default=None,
        title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__}) (Required for init)",
    )
    target_uid: str | None = Field(default=None, title="Target UID (Required for init)")
    start_at: datetime | None = Field(
        default=None, title=f"Start time (Required if running_type is not {BotScheduleRunningType.Infinite})"
    )
    end_at: datetime | None = Field(
        default=None, title=f"End time (Required if running_type is {BotScheduleRunningType.Duration})"
    )
