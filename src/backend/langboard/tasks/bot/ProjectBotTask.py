from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Project
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def project_updated(user_or_bot: User | Bot, project: Project):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectUpdated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectUpdated, BotTaskDataHelper.create_project(user_or_bot, project), project
    )


@Broker.wrap_async_task_decorator
async def project_deleted(user: User, project: Project):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectDeleted, BotTaskDataHelper.create_project(user, project), project
    )
