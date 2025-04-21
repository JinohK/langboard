from typing import Literal
from ...core.ai import Bot, BotDefaultTrigger, BotSchedule
from ...core.broker import Broker
from ...core.db import BaseSqlModel, DbSession, SqlBuilder, User
from ...core.utils.ModelUtils import get_model_by_table_name
from ...models import Card, CardComment, Project, ProjectColumn, ProjectWiki
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.schema(BotDefaultTrigger.BotCreated)
@Broker.wrap_async_task_decorator
async def bot_created(bot: Bot):
    await BotTaskHelper.run(bot, BotDefaultTrigger.BotCreated, {})


@BotTaskDataHelper.project_schema(BotDefaultTrigger.BotProjectAssigned)
@Broker.wrap_async_task_decorator
async def bot_project_assigned(user: User, project: Project, old_bot_ids: list[int], new_bot_ids: list[int]):
    first_time_assigned_bots = await BotTaskDataHelper.get_updated_assigned_bots(old_bot_ids, new_bot_ids)

    await BotTaskHelper.run(
        first_time_assigned_bots,
        BotDefaultTrigger.BotProjectAssigned,
        BotTaskDataHelper.create_project(user, project),
        project,
    )


@BotTaskDataHelper.schema(
    BotDefaultTrigger.BotMentioned,
    {
        "mentioned_in": "Literal[card, comment, project_wiki]",
        "project": Project.api_schema(),
        "project_column?": ProjectColumn.api_schema(),
        "card?": Card.api_schema(),
        "comment?": CardComment.api_schema(),
        "project_wiki?": ProjectWiki.api_schema(),
    },
)
@Broker.wrap_async_task_decorator
async def bot_mentioned(bot: Bot, mentioned_in: Literal["card", "comment", "project_wiki"], models: list[BaseSqlModel]):
    data = {}
    project = None
    for model in models:
        if isinstance(model, Card):
            data["card"] = model.api_response()
        elif isinstance(model, CardComment):
            data["comment"] = model.api_response()
        elif isinstance(model, ProjectWiki):
            data["project_wiki"] = model.api_response()
        elif isinstance(model, ProjectColumn):
            data["project_column"] = model.api_response()
        elif isinstance(model, Project):
            project = model
            data["project"] = model.api_response()

    if not project:
        return

    await BotTaskHelper.run(bot, BotDefaultTrigger.BotMentioned, {"mentioned_in": mentioned_in, **data}, project)


@BotTaskDataHelper.schema(
    BotDefaultTrigger.BotCronScheduled,
    {"project": Project.api_schema(), "project_column": ProjectColumn.api_schema(), "card?": Card.api_schema()},
)
@Broker.wrap_async_task_decorator
async def bot_cron_scheduled(bot: Bot, bot_schedule: BotSchedule):
    table = get_model_by_table_name(bot_schedule.target_table)
    if not table:
        return

    async with DbSession.use() as db:
        result = await db.exec(SqlBuilder.select.table(table).where(table.column("id") == bot_schedule.target_id))
    model = result.first()
    if not model:
        return

    if isinstance(model, ProjectColumn):
        async with DbSession.use() as db:
            result = await db.exec(SqlBuilder.select.table(Project).where(Project.column("id") == model.project_id))
        project = result.first()
        if not project:
            return
        data = {"project_column": model.api_response(), "project": project.api_response()}
    elif isinstance(model, Card):
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(ProjectColumn, Project)
                .join(Project, ProjectColumn.column("project_id") == Project.column("id"))
                .where(ProjectColumn.column("id") == model.project_column_id)
            )
        column, project = result.first() or (None, None)
        if not column or not project:
            return
        data = {
            "project_column": column.api_response(),
            "card": model.api_response(),
            "project": project.api_response(),
        }
    else:
        return

    await BotTaskHelper.run(bot, BotDefaultTrigger.BotCronScheduled, data, project)


async def run_scheduled_bot_cron(interval_str: str):
    async with DbSession.use() as db:
        result = await db.exec(
            SqlBuilder.select.tables(BotSchedule, Bot)
            .join(Bot, BotSchedule.column("bot_id") == Bot.column("id"))
            .where(BotSchedule.column("interval_str") == interval_str)
        )

    for bot_schedule, bot in result.all():
        bot_cron_scheduled(bot, bot_schedule)
