from typing import Literal
from core.db import BaseSqlModel
from helpers import BotHelper, ModelHelper
from models import Bot, Project
from ...ai import BotDefaultTrigger
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.schema(BotDefaultTrigger.BotCreated)
@Broker.wrap_async_task_decorator
async def bot_created(bot: Bot):
    await BotTaskHelper.run(bot, BotDefaultTrigger.BotCreated, {})


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
    bot: Bot,
    mentioned_in: Literal["card", "comment", "project_wiki"],
    dumped_models: list[tuple[str, dict]],
):
    models: list[BaseSqlModel] = []
    for dumped_model in dumped_models:
        table_model, model_data = dumped_model
        table = ModelHelper.get_model_by_table_name(table_model)
        if not table:
            continue
        try:
            model = table.model_validate(model_data)
            models.append(model)
        except Exception:
            continue

    data = {}
    project = None
    scope_model: BaseSqlModel | None = None
    for model in models:
        data[f"{model.__tablename__}_uid"] = model.get_uid()
        if isinstance(model, Project):
            project = model
        if model.__tablename__ in BotHelper.AVAILABLE_TARGET_TABLES:
            scope_model = model

    if not project:
        return

    await BotTaskHelper.run(
        bot,
        BotDefaultTrigger.BotMentioned,
        {"mentioned_in": mentioned_in, **data},
        project,
        scope_model,
    )
