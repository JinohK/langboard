from typing import Any
from models import Bot, Project, ProjectColumn, User
from models.BotTrigger import BotTriggerCondition
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "project_column_uid": "string",
        **(other_schema or {}),
    }


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectColumnCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def project_column_created(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnCreated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnCreated, create_column_data(user_or_bot, project, column), project
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectColumnNameChanged, _create_schema())
@Broker.wrap_async_task_decorator
async def project_column_name_changed(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnNameChanged)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnNameChanged, create_column_data(user_or_bot, project, column), project
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectColumnDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def project_column_deleted(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectColumnDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectColumnDeleted, create_column_data(user_or_bot, project, column), project
    )


def create_column_data(
    user_or_bot: User | Bot,
    project: Project,
    column: ProjectColumn,
    other_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project(user_or_bot, project),
        "project_column_uid": column.get_uid(),
        **(other_data or {}),
    }
