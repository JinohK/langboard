from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Project
from .utils import BotTaskDataHelper, BotTaskHelper


@BotTaskDataHelper.project_schema(
    BotTriggerCondition.ProjectUpdated,
    BotTaskDataHelper.changes_schema(
        ("title", "string?"), ("description", "string?"), ("project_type", "string?"), ("ai_description", "string?")
    ),
)
@Broker.wrap_async_task_decorator
async def project_updated(user_or_bot: User | Bot, old_dict: dict[str, Any], project: Project):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectUpdated)
    await BotTaskHelper.run(
        bots,
        BotTriggerCondition.ProjectUpdated,
        {
            **BotTaskDataHelper.create_project(user_or_bot, project),
            **BotTaskDataHelper.create_changes(old_dict, project),
        },
        project,
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectDeleted)
@Broker.wrap_async_task_decorator
async def project_deleted(user: User, project: Project):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectDeleted, BotTaskDataHelper.create_project(user, project), project
    )
