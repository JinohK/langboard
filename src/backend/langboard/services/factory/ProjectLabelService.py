from typing import cast
from ...core.service import BaseService
from ...models import Project, ProjectLabel
from .Types import TProjectParam


class ProjectLabelService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_label"

    async def get_all_by_project(self, project: TProjectParam) -> list[ProjectLabel]:
        project = cast(Project, await self._get_by_param(Project, project))
        labels = await self._get_all_by(ProjectLabel, "project_id", project.id)
        return list(labels)

    async def create_defaults(self, project: TProjectParam) -> list[ProjectLabel]:
        project = cast(Project, await self._get_by_param(Project, project))
        labels: list[ProjectLabel] = []
        for default_label in ProjectLabel.DEFAULT_LABELS:
            label = ProjectLabel(
                project_id=project.id,
                name=default_label["name"],
                color=default_label["color"],
            )
            labels.append(label)
            self._db.insert(label)
        await self._db.commit()
        return labels
