from ..core.ai import Bot
from ..core.broker import Broker
from ..core.db import User
from ..models import Card, Checklist, Project, ProjectActivity
from ..models.ProjectActivity import ProjectActivityType
from .ActivityHistoryHelper import ActivityHistoryHelper
from .ActivityTaskHelper import ActivityTaskHelper
from .UserActivityTask import record_project_activity


@Broker.wrap_async_task_decorator
async def card_checklist_created(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = await _get_default_history(helper, project, card, checklist)
        activity = await helper.record(
            user_or_bot,
            activity_history,
            **_get_activity_params(ProjectActivityType.CardChecklistCreated, project, card),
        )
    record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checklist_title_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_title: str, checklist: Checklist
):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = {
            **await _get_default_history(helper, project, card, checklist),
            "changes": {"before": {"title": old_title}, "after": {"title": checklist.title}},
        }
        activity = await helper.record(
            user_or_bot,
            activity_history,
            **_get_activity_params(ProjectActivityType.CardChecklistTitleChanged, project, card),
        )
    record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checklist_checked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = await _get_default_history(helper, project, card, checklist)
        activity = await helper.record(
            user_or_bot,
            activity_history,
            **_get_activity_params(ProjectActivityType.CardChecklistChecked, project, card),
        )
    record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checklist_unchecked(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = await _get_default_history(helper, project, card, checklist)
        activity = await helper.record(
            user_or_bot,
            activity_history,
            **_get_activity_params(ProjectActivityType.CardChecklistUnchecked, project, card),
        )
    record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_checklist_deleted(user_or_bot: User | Bot, project: Project, card: Card, checklist: Checklist):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = await _get_default_history(helper, project, card, checklist)
        activity = await helper.record(
            user_or_bot,
            activity_history,
            **_get_activity_params(ProjectActivityType.CardChecklistDeleted, project, card),
        )
    record_project_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, card: Card, checklist: Checklist):
    return {
        **await helper.create_project_default_history(project, card),
        "checklist": ActivityHistoryHelper.create_checklist_or_checkitem_history(checklist),
    }


def _get_activity_params(activity_type: ProjectActivityType, project: Project, card: Card):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "card_id": card.id,
    }

    return activity_params
