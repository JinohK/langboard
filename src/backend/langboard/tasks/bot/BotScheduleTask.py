from ...core.ai import Bot, BotDefaultTrigger, BotSchedule, BotScheduleRunningType, BotScheduleStatus
from ...core.broker import Broker
from ...core.db import DbSession, SnowflakeID, SqlBuilder
from ...core.service import BotScheduleService
from ...core.utils.DateTime import now
from ...core.utils.ModelUtils import get_model_by_table_name
from ...models import Card, Project, ProjectColumn
from ...publishers import ProjectBotPublisher
from .utils import BotTaskDataHelper, BotTaskHelper
from .utils.BotTaskHelper import logger


@BotTaskDataHelper.schema(
    BotDefaultTrigger.BotCronScheduled,
    {
        "project_uid": "string",
        "project_column_uid": "string",
        "card_uid?": "string",
        "scope": "string",
    },
)
@Broker.wrap_async_task_decorator
async def bot_cron_scheduled(bot: Bot, bot_schedule: BotSchedule):
    await _run_bot(bot, bot_schedule)


async def run_scheduled_bots_cron(interval_str: str):
    if interval_str.startswith("scheduled "):
        await _check_bot_schedule_runnable(interval_str.removeprefix("scheduled "))
        return

    if not BotScheduleService.is_valid_interval_str(interval_str):
        logger.error(f"Invalid interval string: {interval_str}")
        return

    records = []
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.tables(BotSchedule, Bot)
            .join(Bot, BotSchedule.column("bot_id") == Bot.column("id"))
            .where(
                (BotSchedule.column("interval_str") == interval_str)
                & (BotSchedule.column("status") == BotScheduleStatus.Started)
            )
        )
        records = result.all()

    for bot_schedule, bot in records:
        await _run_bot(bot, bot_schedule)


async def _check_bot_schedule_runnable(interval_str: str):
    current_time = now()
    records = []
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.tables(BotSchedule, Bot)
            .join(Bot, BotSchedule.column("bot_id") == Bot.column("id"))
            .where(
                (BotSchedule.column("status") == BotScheduleStatus.Pending)
                & (BotSchedule.column("start_at") <= current_time)
                & (BotSchedule.column("interval_str") == interval_str)
            )
        )
        records = result.all()

    for bot_schedule, bot in records:
        if bot_schedule.running_type == BotScheduleRunningType.Duration:
            if (
                not bot_schedule.start_at
                or not bot_schedule.end_at
                or bot_schedule.start_at >= bot_schedule.end_at
                or bot_schedule.end_at < current_time
            ):
                continue

        await BotScheduleService.change_status(bot_schedule, BotScheduleStatus.Started)

        model = _get_target_model(bot_schedule.target_table, bot_schedule.target_id)
        if model:
            project = None
            if isinstance(model, ProjectColumn) or isinstance(model, Card):
                with DbSession.use(readonly=True) as db:
                    result = db.exec(SqlBuilder.select.table(Project).where(Project.column("id") == model.project_id))
                    project = result.first()

            if project:
                ProjectBotPublisher.rescheduled(project, bot_schedule, {"status": bot_schedule.status.value})

        await _run_bot(bot, bot_schedule)


async def _run_bot(bot: Bot, bot_schedule: BotSchedule):
    if bot_schedule.status != BotScheduleStatus.Started:
        return

    model = _get_target_model(bot_schedule.target_table, bot_schedule.target_id)
    if not model:
        return

    project = None
    data = {}
    with DbSession.use(readonly=True) as db:
        if isinstance(model, ProjectColumn):
            result = db.exec(SqlBuilder.select.table(Project).where(Project.column("id") == model.project_id))
            project = result.first()
            if not project:
                return
            data = {
                "project_column_uid": model.get_uid(),
                "project_uid": project.get_uid(),
                "scope": ProjectColumn.__tablename__,
            }
        elif isinstance(model, Card):
            result = db.exec(
                SqlBuilder.select.tables(ProjectColumn, Project)
                .join(Project, ProjectColumn.column("project_id") == Project.column("id"))
                .where(ProjectColumn.column("id") == model.project_column_id)
            )
            column, project = result.first() or (None, None)
            if not column or not project:
                return
            data = {
                "project_column_uid": column.get_uid(),
                "card_uid": model.get_uid(),
                "project_uid": project.get_uid(),
                "scope": Card.__tablename__,
            }
        else:
            return

    BotTaskHelper.run(bot, BotDefaultTrigger.BotCronScheduled, data, project)

    old_status = bot_schedule.status
    if bot_schedule.running_type == BotScheduleRunningType.Onetime:
        await BotScheduleService.change_status(bot_schedule, BotScheduleStatus.Stopped)
    elif bot_schedule.running_type == BotScheduleRunningType.Duration:
        if bot_schedule.end_at and bot_schedule.end_at < now():
            await BotScheduleService.change_status(bot_schedule, BotScheduleStatus.Stopped)

    if project and bot_schedule.status != old_status:
        ProjectBotPublisher.rescheduled(project, bot_schedule, {"status": bot_schedule.status.value})


def _get_target_model(target_table: str, target_id: SnowflakeID | int):
    table = get_model_by_table_name(target_table)
    if not table:
        return None

    model = None
    with DbSession.use(readonly=True) as db:
        result = db.exec(SqlBuilder.select.table(table).where(table.column("id") == target_id).limit(1))
        model = result.first()
    if not model:
        return None

    return model
