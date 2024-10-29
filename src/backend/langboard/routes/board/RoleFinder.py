from typing import Any, Sequence
from sqlmodel.sql.expression import SelectOfScalar
from ...models import Project, ProjectRole


def project_role_finder(
    query: SelectOfScalar[Sequence[str]], path_params: dict[str, Any]
) -> SelectOfScalar[Sequence[str]]:
    query = query.join(Project, (Project.id == ProjectRole.project_id) & (Project.deleted_at == None)).where(  # type: ignore # noqa
        Project.uid == path_params["project_uid"]
    )
    return query
