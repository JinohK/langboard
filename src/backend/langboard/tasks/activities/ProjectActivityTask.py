from typing import Any
from ...core.ai import Bot
from ...core.broker import Broker
from ...core.db import User
from ...models import Project, ProjectActivity
from ...models.ProjectActivity import ProjectActivityType
from .UserActivityTask import record_project_activity
from .utils import ActivityHistoryHelper, ActivityTaskHelper


@Broker.wrap_async_task_decorator
async def project_created(user: User, project: Project):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await helper.create_project_default_history(project)
    activity = await helper.record(
        user, activity_history, **_get_activity_params(ProjectActivityType.ProjectCreated, project)
    )
    await record_project_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_updated(user_or_bot: User | Bot, old_dict: dict[str, Any], project: Project):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await helper.create_project_default_history(project),
        **await ActivityHistoryHelper.create_changes(old_dict, project),
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.ProjectUpdated, project)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def project_assigned_bots_updated(user: User, project: Project, old_bot_ids: list[int], new_bot_ids: list[int]):
    helper = ActivityTaskHelper(ProjectActivity)
    removed_bots, added_bots = await helper.get_updated_bots(old_bot_ids, new_bot_ids)
    if not removed_bots and not added_bots:
        return

    activity_history = {
        **await helper.create_project_default_history(project),
        "removed_bots": removed_bots,
        "added_bots": added_bots,
    }
    activity = await helper.record(
        user, activity_history, **_get_activity_params(ProjectActivityType.ProjectAssignedBotsUpdated, project)
    )
    await record_project_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_assigned_users_updated(
    user: User, project: Project, old_user_ids: list[int], new_user_ids: list[int]
):
    helper = ActivityTaskHelper(ProjectActivity)
    removed_users, added_users = await helper.get_updated_users(old_user_ids, new_user_ids)
    if not removed_users and not added_users:
        return

    activity_history = {
        **await helper.create_project_default_history(project),
        "removed_users": removed_users,
        "added_users": added_users,
    }
    activity = await helper.record(
        user, activity_history, **_get_activity_params(ProjectActivityType.ProjectAssignedUsersUpdated, project)
    )
    await record_project_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_bot_activation_toggled(user: User, project: Project, bot: Bot, is_disabled: bool):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await helper.create_project_default_history(project),
        "bot": ActivityHistoryHelper.create_user_or_bot_history(bot),
        "changes": {
            "before": {"is_disabled": not is_disabled},
            "after": {"is_disabled": is_disabled},
        },
    }
    activity_type = (
        ProjectActivityType.ProjectBotDeactivated if is_disabled else ProjectActivityType.ProjectBotActivated
    )
    activity = await helper.record(user, activity_history, **_get_activity_params(activity_type, project))
    await record_project_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_invited_user_accepted(user: User, project: Project):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await helper.create_project_default_history(project)
    activity = await helper.record(
        user,
        activity_history,
        **_get_activity_params(ProjectActivityType.ProjectInvitedUserAccepted, project),
    )
    await record_project_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_deleted(user: User, project: Project):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await helper.create_project_default_history(project)
    activity = await helper.record(
        user, activity_history, **_get_activity_params(ProjectActivityType.ProjectDeleted, project)
    )
    await record_project_activity(user, activity)


def _get_activity_params(activity_type: ProjectActivityType, project: Project):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
    }

    return activity_params
