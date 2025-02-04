from ...core.ai import Bot
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, Checkitem, Project, ProjectActivity
from ...models.ProjectActivity import ProjectActivityType
from .UserActivityTask import record_project_activity
from .utils import ActivityHistoryHelper, ActivityTaskHelper


@Broker.wrap_async_task_decorator
async def card_checkitem_created(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemCreated, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_title_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_title: str, checkitem: Checkitem
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, checkitem),
        "changes": {"before": {"title": old_title}, "after": {"title": checkitem.title}},
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemTitleChanged, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_started(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemTimerStarted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_paused(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemTimerPaused, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_timer_stopped(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemTimerStopped, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_checked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemChecked, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemUnchecked, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_cardified(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, checkitem),
        "record_ids": [(checkitem.cardified_id, "cardified_card")],
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemDeleted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checkitem_deleted(user_or_bot: User | Bot, project: Project, card: Card, checkitem: Checkitem):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, checkitem)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCheckitemDeleted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, card: Card, checkitem: Checkitem):
    return {
        **await helper.create_project_default_history(project, card),
        "checkitem": ActivityHistoryHelper.create_checklist_or_checkitem_history(checkitem),
    }


def _get_activity_params(activity_type: ProjectActivityType, project: Project, card: Card):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "card_id": card.id,
    }

    return activity_params
