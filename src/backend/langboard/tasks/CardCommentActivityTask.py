from typing import cast
from ..core.ai import Bot
from ..core.broker import Broker
from ..core.db import DbSession, EditorContentModel, SqlBuilder, User
from ..models import Card, CardComment, Project, ProjectActivity
from ..models.ProjectActivity import ProjectActivityType
from .ActivityHistoryHelper import ActivityHistoryHelper
from .ActivityTaskHelper import ActivityTaskHelper
from .UserActivityTask import record_project_activity


@Broker.wrap_async_task_decorator
async def card_comment_added(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, comment)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCommentAdded, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_comment_updated(
    user_or_bot: User | Bot, project: Project, card: Card, old_content: EditorContentModel | None, comment: CardComment
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, comment),
        "changes": {
            "before": {"content": await ActivityHistoryHelper.convert_to_python(old_content)},
            "after": {"content": await ActivityHistoryHelper.convert_to_python(comment.content)},
        },
    }
    activity = await helper.record(
        user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.CardCommentUpdated, project, card)
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_comment_deleted(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = await _get_default_history(helper, project, card, comment)
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCommentDeleted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_comment_reacted(
    user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment, reaction_type: str
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, comment),
        "reaction_type": reaction_type,
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCommentReacted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def card_comment_unreacted(
    user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment, reaction_type: str
):
    helper = ActivityTaskHelper(ProjectActivity)
    activity_history = {
        **await _get_default_history(helper, project, card, comment),
        "reaction_type": reaction_type,
    }
    activity = await helper.record(
        user_or_bot,
        activity_history,
        **_get_activity_params(ProjectActivityType.CardCommentUnreacted, project, card),
    )
    await record_project_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, card: Card, comment: CardComment):
    target_model = User if comment.user_id else Bot
    target_id = comment.user_id if comment.user_id else comment.bot_id
    async with DbSession.use_db() as db:
        result = await db.exec(
            SqlBuilder.select.table(target_model, with_deleted=True).where(target_model.column("id") == target_id)
        )
    user_or_bot = cast(User | Bot, result.first())
    history = {
        **await helper.create_project_default_history(project, card),
        "comment": await ActivityHistoryHelper.create_card_comment_history(comment, user_or_bot),
    }

    return history


def _get_activity_params(activity_type: ProjectActivityType, project: Project, card: Card):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
        "card_id": card.id,
    }

    return activity_params
