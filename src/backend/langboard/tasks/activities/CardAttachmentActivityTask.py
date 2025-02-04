from ...core.ai import Bot
from ...core.broker import Broker
from ...core.db import User
from ...models import Card, CardAttachment, Project, ProjectActivity
from ...models.ProjectActivity import ProjectActivityType
from .UserActivityTask import record_project_activity
from .utils import ActivityHistoryHelper, ActivityTaskHelper


@Broker.wrap_async_task_decorator
async def card_attachment_uploaded(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, attachment)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardAttachmentUploaded, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_attachment_name_changed(
    user_or_bot: User | Bot, project: Project, card: Card, old_name: str, attachment: CardAttachment
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, attachment),
        "changes": {"before": {"name": old_name}, "after": {"name": attachment.filename}},
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardAttachmentNameChanged, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_attachment_deleted(user_or_bot: User | Bot, project: Project, card: Card, attachment: CardAttachment):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, attachment)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.ProjectLabelDeleted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, card: Card, attachment: CardAttachment):
    return {
        **await helper.create_project_default_history(project, card),
        "attachment": ActivityHistoryHelper.create_card_attachment_history(attachment),
    }


def _get_activity_params(activity_type: ProjectActivityType, project: Project, card: Card):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "card_id": card.id,
    }

    return activity_params
