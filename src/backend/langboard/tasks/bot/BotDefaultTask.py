from ...core.ai import Bot
from ...core.broker import Broker
from ...core.db import User
from ...models import Project
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.schema("bot_created")
@Broker.wrap_async_task_decorator
async def bot_created(bot: Bot):
    await BotTaskHelper.run(bot, "bot_created", {})


@BotTaskDataHelper.project_schema("bot_project_assigned")
@Broker.wrap_async_task_decorator
async def bot_project_assigned(user: User, project: Project, old_bot_ids: list[int], new_bot_ids: list[int]):
    first_time_assigned_bots = await BotTaskDataHelper.get_updated_assigned_bots(old_bot_ids, new_bot_ids)

    await BotTaskHelper.run(
        first_time_assigned_bots, "bot_project_assigned", BotTaskDataHelper.create_project(user, project), project
    )
