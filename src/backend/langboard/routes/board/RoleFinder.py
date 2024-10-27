from typing import Any, Sequence
from sqlmodel.sql.expression import SelectOfScalar
from ...models import Project, ProjectRole


def project_role_finder(
    query: SelectOfScalar[Sequence[str]], path_params: dict[str, Any]
) -> SelectOfScalar[Sequence[str]]:
    query = query.join(Project, Project.id == ProjectRole.project_id).where(Project.uid == path_params["project_uid"])  # type: ignore
    return query
