from typing import Any, Sequence
from sqlmodel.sql.expression import SelectOfScalar
from ...models import Project, ProjectRole


def project_role_finder(
    query: SelectOfScalar[Sequence[str]], path_params: dict[str, Any]
) -> SelectOfScalar[Sequence[str]]:
    project_uid = path_params.get("project_uid", None)
    if not project_uid:
        project_uid = path_params.get("board_id", path_params.get("project_id", None))

    query = query.join(Project, (Project.column("id") == ProjectRole.project_id) & (Project.deleted_at == None)).where(  # noqa
        Project.uid == project_uid
    )
    return query
