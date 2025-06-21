from typing import Any
from models import Bot, Project, ProjectLabel, User
from models.BotTrigger import BotTriggerCondition
from ...core.broker import Broker
from .utils import BotTaskDataHelper, BotTaskHelper


def _create_schema(other_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "project_label_uid": "string",
        **(other_schema or {}),
    }


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectLabelCreated, _create_schema())
@Broker.wrap_async_task_decorator
async def project_label_created(user_or_bot: User | Bot, project: Project, label: ProjectLabel):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectLabelCreated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectLabelCreated, create_label_data(user_or_bot, project, label), project
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectLabelUpdated, _create_schema())
@Broker.wrap_async_task_decorator
async def project_label_updated(user_or_bot: User | Bot, project: Project, label: ProjectLabel):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectLabelUpdated)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectLabelUpdated, create_label_data(user_or_bot, project, label), project
    )


@BotTaskDataHelper.project_schema(BotTriggerCondition.ProjectLabelDeleted, _create_schema())
@Broker.wrap_async_task_decorator
async def project_label_deleted(user_or_bot: User | Bot, project: Project, label: ProjectLabel):
    bots = BotTaskHelper.get_project_assigned_bots(project, BotTriggerCondition.ProjectLabelDeleted)
    await BotTaskHelper.run(
        bots, BotTriggerCondition.ProjectLabelDeleted, create_label_data(user_or_bot, project, label), project
    )


def create_label_data(
    user_or_bot: User | Bot, project: Project, label: ProjectLabel, other_data: dict[str, Any] | None = None
) -> dict[str, Any]:
    return {
        **BotTaskDataHelper.create_project(user_or_bot, project),
        "project_label_uid": label.get_uid(),
        **(other_data or {}),
    }
