from typing import Literal
from ...core.ai import Bot, BotDefaultTrigger
from ...core.broker import Broker
from ...core.db import BaseSqlModel, User
from ...core.utils.ModelUtils import get_model_by_table_name
from ...models import Project
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
        "project_uid": "string",
        "project_column_uid?": "string",
        "card_uid?": "string",
        "comment_uid?": "string",
        "project_wiki_uid?": "string",
    },
)
@Broker.wrap_async_task_decorator
async def bot_mentioned(
    bot: Bot, mentioned_in: Literal["card", "comment", "project_wiki"], dumped_models: list[tuple[str, dict]]
):
    models: list[BaseSqlModel] = []
    for dumped_model in dumped_models:
        table_model, model_data = dumped_model
        table = get_model_by_table_name(table_model)
        if not table:
            continue
        try:
            model = table.model_validate(model_data)
            models.append(model)
        except Exception:
            continue

    data = {}
    project = None
    for model in models:
        data[f"{model.__tablename__}_uid"] = model.get_uid()
        if isinstance(model, Project):
            project = model

    if not project:
        return

    await BotTaskHelper.run(bot, BotDefaultTrigger.BotMentioned, {"mentioned_in": mentioned_in, **data}, project)
