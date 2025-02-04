from typing import Any
from sqlmodel.sql.expression import SelectOfScalar
from ....core.db import SnowflakeID
from ....core.routing import SocketTopic
from ....models import Project, ProjectRole


def project_role_finder(query: SelectOfScalar[ProjectRole], path_params: dict[str, Any]) -> SelectOfScalar[ProjectRole]:
    key_prefixes = [SocketTopic.Board.value, SocketTopic.BoardWiki.value]
    project_uid = path_params.get("project_uid", None)
    if not project_uid:
        for key in key_prefixes:
            project_uid = path_params.get(f"{key}_id", None)
            if project_uid:
                break

    query = query.join(
        Project,
        (Project.column("id") == ProjectRole.column("project_id")) & (Project.column("deleted_at") == None),  # noqa
    ).where(Project.column("id") == SnowflakeID.from_short_code(project_uid))
    return query
