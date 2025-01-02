from typing import Any, Sequence
from sqlmodel.sql.expression import SelectOfScalar
from ....core.db import SnowflakeID
from ....core.routing import SocketTopic
from ....models import Project, ProjectRole


def project_role_finder(
    query: SelectOfScalar[Sequence[str]], path_params: dict[str, Any]
) -> SelectOfScalar[Sequence[str]]:
    key_prefixes = [SocketTopic.Board.value, SocketTopic.BoardWiki.value]
    project_uid = path_params.get("project_uid", None)
    if not project_uid:
        for key in key_prefixes:
            project_uid = path_params.get(f"{key}_id", None)
            if project_uid:
                break

    query = query.join(
        Project,
        (Project.column("id") == ProjectRole.project_id) & (Project.deleted_at == None),  # noqa
    ).where(Project.id == SnowflakeID.from_short_code(project_uid))
    return query
