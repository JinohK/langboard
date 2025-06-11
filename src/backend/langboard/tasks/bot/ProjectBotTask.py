from ...core.broker import Broker
from ...models import Bot, Project, User
from ...models.BotTrigger import BotTriggerCondition
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectUpdated)
@Broker.wrap_async_task_decorator
async def project_updated(user_or_bot: User | Bot, project: Project):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectUpdated)
    BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectUpdated, BotTaskDataHelper.create_project(user_or_bot, project), project
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectDeleted)
@Broker.wrap_async_task_decorator
async def project_deleted(user: User, project: Project):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectDeleted)
    BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectDeleted, BotTaskDataHelper.create_project(user, project), project
    )
