from typing import Any
from sqlmodel.sql.expression import SelectOfScalar
from ....core.db import SnowflakeID
from ....core.routing import SocketTopic
from ....models import Project, ProjectAssignedBot, ProjectRole


def project_role_finder(
    query: SelectOfScalar[ProjectRole], path_params: dict[str, Any], user_or_bot_id: int, is_bot: bool
) -> SelectOfScalar[ProjectRole]:
    key_prefixes = [
        SocketTopic.Dashboard.value,
        SocketTopic.Board.value,
        SocketTopic.BoardWiki.value,
        SocketTopic.BoardSettings.value,
    ]
    project_uid: str | set | list | None = path_params.get("project_uid", None)
    if not project_uid:
        for key in key_prefixes:
            project_uid = path_params.get(f"{key}_id", None)
            if project_uid:
                break

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
