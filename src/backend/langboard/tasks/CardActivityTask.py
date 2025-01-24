from typing import Any
from ..core.ai import Bot
from ..core.broker import Broker
from ..core.db import User
from ..models import Card, Project, ProjectActivity, ProjectColumn
from ..models.ProjectActivity import ProjectActivityType
from .ActivityHistoryHelper import ActivityHistoryHelper
from .ActivityTaskHelper import ActivityTaskHelper
from .UserActivityTask import record_project_activity


@Broker.wrap_async_task_decorator
async def card_created(user_or_bot: User | Bot, project: Project, card: Card):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await helper.create_project_default_history(project, card)
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardCreated, project, card)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_updated(user_or_bot: User | Bot, project: Project, old_dict: dict[str, Any], card: Card):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await helper.create_project_default_history(project, card),
        **await ActivityHistoryHelper.create_changes(old_dict, card),
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardUpdated, project, card)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_moved(
    user_or_bot: User | Bot,
    project: Project,
    card: Card,
    from_column: ProjectColumn,
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await helper.create_project_default_history(project, card),
        "from_column": ActivityHistoryHelper.create_project_column_history(from_column),
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardMoved, project, card)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_assigned_users_updated(
    user_or_bot: User | Bot, project: Project, card: Card, old_user_ids: list[int], new_user_ids: list[int]
):
    helper = ActivityTaskHelper(ProjectActivity)
    removed_users, added_users = await helper.get_updated_users(old_user_ids, new_user_ids)
    if not removed_users and not added_users:
        return

    activity_history = {
        **await helper.create_project_default_history(project, card),
        "removed_users": removed_users,
        "added_users": added_users,
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardAssignedUsersUpdated, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_labels_updated(
    user_or_bot: User | Bot, project: Project, card: Card, old_label_ids: list[int], new_label_ids: list[int]
):
    helper = ActivityTaskHelper(ProjectActivity)
    removed_labels, added_labels = await helper.get_updated_labels(old_label_ids, new_label_ids)
    if not removed_labels and not added_labels:
        return

    activity_history = {
        **await helper.create_project_default_history(project, card),
        "removed_labels": removed_labels,
        "added_labels": added_labels,
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardLabelsUpdated, project, card)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_deleted(user_or_bot: User | Bot, project: Project, card: Card):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await helper.create_project_default_history(project, card)
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardDeleted, project, card)
    )
    await record_project_activity(user_or_bot, activity)


def _get_activity_params(activity_type: ProjectActivityType, project: Project, card: Card):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "card_id": card.id,
    }

    return activity_params
