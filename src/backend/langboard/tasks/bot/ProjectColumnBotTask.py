from typing import Any
from ...core.ai import Bot, BotTriggerCondition
from ...core.broker import Broker
from ...core.db import User
from ...models import Project, ProjectColumn
from .utils import BotTaskDataHelper, BotTaskHelper


@Broker.wrap_async_task_decorator
async def project_column_created(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnCreated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnCreated, create_column_data(user_or_bot, project, column), project
    )


@Broker.wrap_async_task_decorator
async def project_column_name_changed(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnNameChanged)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnNameChanged, create_column_data(user_or_bot, project, column), project
    )


@Broker.wrap_async_task_decorator
async def project_column_deleted(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = await BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnDeleted, create_column_data(user_or_bot, project, column), project
    )


def create_column_data(user_or_bot: User | Bot, project: Project, column: ProjectColumn) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project(user_or_bot, project),
        "project_column": column.api_response(),
    }
