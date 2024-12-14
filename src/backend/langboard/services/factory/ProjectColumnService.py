from typing import cast
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
from ...models import (
    Card,
    Project,
    ProjectColumn,
    User,
)


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def count_cards(self, project_id: int, column_uid: str) -> int:
        sql_query = self._db.query("select").count(Card, Card.id).where(Card.column("project_id") == project_id)
        if column_uid == Project.ARCHIVE_COLUMN_UID:
            sql_query = sql_query.where(Card.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.where(Card.column("project_column_uid") == column_uid)
        result = await self._db.exec(sql_query)
        count = cast(int, result.one())
        return count

    async def change_name(
        self, user: User, project_uid: str, column_uid: str, name: str
    ) -> ModelIdBaseResult[bool] | None:
        project = await self._get_by(Project, "uid", project_uid)
        if not project:
            return None

        if column_uid == Project.ARCHIVE_COLUMN_UID:
            # original_name = project.archive_column_name
            project.archive_column_name = name
            await self._db.update(project)
        else:
            column = await self._get_by(ProjectColumn, "uid", column_uid)
            if not column or column.project_id != project.id:
                return None
            # original_name = column.name
            column.name = name
            await self._db.update(column)

        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {
                "uid": column_uid,
                "name": name,
            }
        )

        return ModelIdBaseResult(model_id, True)

    async def change_order(
        self, user: User, project_uid: str, column_uid: str, order: int
    ) -> ModelIdBaseResult[bool] | None:
        project = await self._get_by(Project, "uid", project_uid)
        if not project:
            return None

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
            # original_column_order = project.archive_column_order
            target_column = columns.pop(project.archive_column_order)
        else:
            target_column = None
            for column in columns:
                if column.uid == column_uid:
                    target_column = column
                    columns.remove(column)
                    break
            if not target_column:
                return None
            # original_column_order = (
            #     target_column.order if isinstance(target_column, ProjectColumn) else project.archive_column_order
            # )

        columns.insert(order, target_column)

        for i, column in enumerate(columns):
            if isinstance(column, Project):
                column.archive_column_order = i
            else:
                column.order = i
            await self._db.update(column)

        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {
                "uid": column_uid,
                "order": order,
            }
        )

        return ModelIdBaseResult(model_id, True)
