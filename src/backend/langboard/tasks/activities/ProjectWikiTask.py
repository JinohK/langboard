from typing import Any
from ...core.ai import Bot
from ...core.broker import Broker
from ...core.db import User
from ...models import Project, ProjectWiki, ProjectWikiActivity
from ...models.ProjectWikiActivity import ProjectWikiActivityType
from .UserActivityTask import record_wiki_activity
from .utils import ActivityHistoryHelper, ActivityTaskHelper


@Broker.wrap_async_task_decorator
async def project_wiki_created(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    helper = ActivityTaskHelper(ProjectWikiActivity)
    activity_history = await _get_default_history(helper, project, wiki)
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectWikiActivityType.WikiCreated, project, wiki)
    )
    await record_wiki_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def project_wiki_updated(user_or_bot: User | Bot, project: Project, old_dict: dict[str, Any], wiki: ProjectWiki):
    helper = ActivityTaskHelper(ProjectWikiActivity)
    activity_history = {
        **await _get_default_history(helper, project, wiki),
        **await ActivityHistoryHelper.create_changes(old_dict, wiki),
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectWikiActivityType.WikiUpdated, project, wiki)
    )
    await record_wiki_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def project_wiki_publicity_changed(
    user_or_bot: User | Bot, project: Project, was_public: bool, wiki: ProjectWiki
):
    helper = ActivityTaskHelper(ProjectWikiActivity)
    activity_history = {
        **await _get_default_history(helper, project, wiki),
        "was_public": was_public,
        "is_public": wiki.is_public,
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectWikiActivityType.WikiPublicityChanged, project, wiki),
    )
    await record_wiki_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def project_wiki_assignees_updated(
    user: User,
    project: Project,
    wiki: ProjectWiki,
    old_bot_ids: list[int],
    new_bot_ids: list[int],
    old_user_ids: list[int],
    new_user_ids: list[int],
):
    helper = ActivityTaskHelper(ProjectWikiActivity)
    removed_bots, added_bots = await helper.get_updated_bots(old_bot_ids, new_bot_ids)
    removed_users, added_users = await helper.get_updated_users(old_user_ids, new_user_ids)
    if not removed_bots and not added_bots and not removed_users and not added_users:
        return

    activity_history: dict[str, Any] = {**await _get_default_history(helper, project, wiki)}
    if removed_bots or added_bots:
        activity_history["removed_bots"] = removed_bots
        activity_history["added_bots"] = added_bots
    if removed_users or added_users:
        activity_history["removed_users"] = removed_users
        activity_history["added_users"] = added_users

    activity = await helper.record(
        user,
        activity_history,
        **_get_activity_params(ProjectWikiActivityType.WikiAssigneesUpdated, project, wiki),
    )
    await record_wiki_activity(user, activity)


@Broker.wrap_async_task_decorator
async def project_wiki_deleted(user_or_bot: User | Bot, project: Project, wiki: ProjectWiki):
    helper = ActivityTaskHelper(ProjectWikiActivity)
    activity_history = await _get_default_history(helper, project, wiki)
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectWikiActivityType.WikiDeleted, project, wiki)
    )
    await record_wiki_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, wiki: ProjectWiki):
    return {
        **await helper.create_project_default_history(project),
        "wiki": ActivityHistoryHelper.create_project_wiki_history(wiki),
    }


def _get_activity_params(activity_type: ProjectWikiActivityType, project: Project, wiki: ProjectWiki):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "project_wiki_id": wiki.id,
    }

    return activity_params
