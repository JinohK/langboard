from ..core.ai import Bot
from ..core.broker import Broker
from ..core.db import User
from ..models import Project, ProjectActivity, ProjectWikiActivity, UserActivity
from ..models.BaseActivityModel import BaseActivityModel
from ..models.UserActivity import UserActivityType
from .ActivityTaskHelper import ActivityTaskHelper


@Broker.wrap_async_task_decorator
async def activated(user: User):
    helper = ActivityTaskHelper(UserActivity)
    activity_history = {
        "activated_at": user.activated_at,
    }
    await helper.record(user, activity_history, activity_type=UserActivityType.Activated)


@Broker.wrap_async_task_decorator
async def declined_project_invitation(user: User, project: Project):
    helper = ActivityTaskHelper(UserActivity)
    activity_history = {
        "project_title": project.title,
    }
    await helper.record(user, activity_history, activity_type=UserActivityType.DeclinedProjectInvitation)


async def record_project_activity(user_or_bot: User | Bot, activity: ProjectActivity):
    if not isinstance(user_or_bot, User):
        return
    helper = ActivityTaskHelper(UserActivity)
    await helper.record(user_or_bot, {}, **_refer_activity(activity))


async def record_wiki_activity(user_or_bot: User | Bot, activity: ProjectWikiActivity):
    if not isinstance(user_or_bot, User):
        return
    helper = ActivityTaskHelper(UserActivity)
    await helper.record(user_or_bot, {}, **_refer_activity(activity))


def _refer_activity(activity: BaseActivityModel):
    return {
        "refer_activity_table": activity.__tablename__,
        "refer_activity_id": activity.id,
    }
