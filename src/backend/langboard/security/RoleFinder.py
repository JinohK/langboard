from typing import Any
from core.types import SnowflakeID
from models import Project, ProjectAssignedBot, ProjectRole
from sqlmodel.sql.expression import SelectOfScalar


def project(
    query: SelectOfScalar[ProjectRole], path_params: dict[str, Any], user_or_bot_id: int, is_bot: bool
) -> SelectOfScalar[ProjectRole]:
    project_uid: str | set | list | None = path_params.get("project_uid", None)

    query = query.join(
        Project,
        (Project.column("id") == ProjectRole.column("project_id")) & (Project.column("deleted_at") == None),  # noqa
    )

    if isinstance(project_uid, (set, list)):
        query = query.where(Project.column("id").in_(SnowflakeID.from_short_code(uid) for uid in project_uid))
    else:
        query = query.where(Project.column("id") == SnowflakeID.from_short_code(project_uid) if project_uid else None)  # type: ignore

    if is_bot:
        query = query.join(ProjectAssignedBot, Project.column("id") == ProjectAssignedBot.column("project_id")).where(
            (ProjectAssignedBot.column("bot_id") == user_or_bot_id)
            & (ProjectAssignedBot.column("is_disabled") == False)  # noqa
        )
    return query
