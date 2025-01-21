from ..core.ai import Bot
from ..core.broker import Broker
from ..core.db import User
from ..models import Project, ProjectActivity, ProjectColumn
from ..models.ProjectActivity import ProjectActivityType
from .ActivityHistoryHelper import ActivityHistoryHelper
from .ActivityTaskHelper import ActivityTaskHelper
from .UserActivityTask import record_project_activity


@Broker.wrap_async_task_decorator
async def project_column_created(user_or_bot: User | Bot, project: Project, column: ProjectColumn):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        activity_history = await _get_default_history(helper, project, column)
        activity = await helper.record(
            user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.ProjectColumnCreated, project)
        )
    await record_project_activity(user_or_bot, activity)


@Broker.wrap_async_task_decorator
async def project_column_name_changed(
    user_or_bot: User | Bot, project: Project, old_name: str, column: Project | ProjectColumn
):
    async with ActivityTaskHelper.use_helper(ProjectActivity) as helper:
        current_name = column.archive_column_name if isinstance(column, Project) else column.name
        activity_history = {
            **await _get_default_history(helper, project, column),
            "changes": {"before": {"name": old_name}, "after": {"name": current_name}},
        }
        activity = await helper.record(
            user_or_bot, activity_history, **_get_activity_params(ProjectActivityType.ProjectColumnNameChanged, project)
        )
    await record_project_activity(user_or_bot, activity)


async def _get_default_history(helper: ActivityTaskHelper, project: Project, column: Project | ProjectColumn):
    history = {
        **await helper.create_project_default_history(project),
        "column": ActivityHistoryHelper.create_project_column_history(column),
    }
    return history


def _get_activity_params(activity_type: ProjectActivityType, project: Project):
    activity_params = {
        "activity_type": activity_type,
        "project_id": project.id,
    }

    return activity_params
