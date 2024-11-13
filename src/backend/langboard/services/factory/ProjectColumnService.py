from typing import cast
from ...models import (
    Project,
    ProjectActivity,
    ProjectColumn,
    Task,
    User,
)
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def count_tasks(self, project_id: int, column_uid: str) -> int:
        sql_query = self._db.query("select").count(Task, Task.id).where(Task.column("project_id") == project_id)
        if column_uid == Project.ARCHIVE_COLUMN_UID:
            sql_query = sql_query.where(Task.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.where(Task.column("project_column_uid") == column_uid)
        result = await self._db.exec(sql_query)
        count = cast(int, result.one())
        return count

    @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.TaskChangedColumn)
    async def change_column_order(
        self, user: User, project_uid: str, column_uid: str, order: int
    ) -> tuple[ActivityResult | None, bool]:
        result = await self._db.exec(
            self._db.query("select").table(Project).where(Project.column("uid") == project_uid).limit(1)
        )
        project = result.first()
        if not project:
            return None, False

        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectColumn)
            .where(ProjectColumn.column("project_id") == project.id)
            .order_by(ProjectColumn.column("order").asc())
            .group_by(ProjectColumn.column("order"))
        )
        columns: list[Project | ProjectColumn] = list(result.all())
        columns.insert(project.archive_column_order, project)

        if column_uid == Project.ARCHIVE_COLUMN_UID:
            original_column_order = project.archive_column_order
            target_column = columns.pop(project.archive_column_order)
        else:
            target_column = None
            for column in columns:
                if column.uid == column_uid:
                    target_column = column
                    columns.remove(column)
                    break
            if not target_column:
                return None, False
            original_column_order = (
                target_column.order if isinstance(target_column, ProjectColumn) else project.archive_column_order
            )

        columns.insert(order, target_column)

        for i, column in enumerate(columns):
            if isinstance(column, Project):
                column.archive_column_order = i
            else:
                column.order = i
            await self._db.update(column)

        activity_result = ActivityResult(
            user_or_bot=user,
            model=project,
            shared={
                "project_uid": project.uid,
                "column_uid": column_uid,
            },
            new={
                "column_order": order,
            },
            old={
                "column_order": original_column_order,
            },
        )

        return activity_result, True
