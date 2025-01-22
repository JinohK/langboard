from typing import Any, cast
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...models import Card, Project, ProjectColumn
from ...publishers import ProjectColumnPublisher
from ...tasks import ProjectColumnActivityTask
from .Types import TColumnParam, TProjectParam, TUserOrBot


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def get_list(self, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectColumn)
                .where(ProjectColumn.column("project_id") == project.id)
                .order_by(ProjectColumn.column("order").asc())
                .group_by(ProjectColumn.column("id"), ProjectColumn.column("order"))
            )
        raw_columns = result.all()
        columns = [raw_column.api_response() for raw_column in raw_columns]
        columns.insert(
            project.archive_column_order,
            {
                "uid": project.ARCHIVE_COLUMN_UID(),
                "project_uid": project.get_uid(),
                "name": project.archive_column_name,
                "order": project.archive_column_order,
            },
        )
        return columns

    async def count_cards(self, project: TProjectParam, column_id: SnowflakeID | str) -> int:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return 0
        column_id = (
            SnowflakeID.from_short_code(column_id)
            if isinstance(column_id, str) and column_id != project.ARCHIVE_COLUMN_UID()
            else column_id
        )
        sql_query = SqlBuilder.select.count(Card, Card.id).where(Card.column("project_id") == project.id)
        if column_id == project.ARCHIVE_COLUMN_UID():
            sql_query = sql_query.where(Card.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.where(Card.column("project_column_id") == column_id)
        async with DbSession.use_db() as db:
            result = await db.exec(sql_query)
            count = result.first() or 0
        return count

    async def create(self, user_or_bot: TUserOrBot, project: TProjectParam, name: str) -> ProjectColumn | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        max_order = await self._get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=project.id,
            name=name,
            order=max_order + 2,  # due to the archive column, the order is incremented by 2
        )

        async with DbSession.use_db() as db:
            db.insert(column)
            await db.commit()

        ProjectColumnPublisher.created(project, column)

        ProjectColumnActivityTask.project_column_created(user_or_bot, project, column)

        return column

    async def change_name(
        self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam, name: str
    ) -> bool | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        if column == project.ARCHIVE_COLUMN_UID() or column == project or column == project.id:
            old_name = project.archive_column_name
            project.archive_column_name = name
            async with DbSession.use_db() as db:
                await db.update(project)
                await db.commit()
            column_id = project.ARCHIVE_COLUMN_UID()
        else:
            column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
            if not column or column.project_id != project.id:
                return None
            old_name = column.name
            column.name = name
            async with DbSession.use_db() as db:
                await db.update(column)
                await db.commit()
            column_id = column.id

        ProjectColumnPublisher.name_changed(project, name, column_id)

        ProjectColumnActivityTask.project_column_name_changed(
            user_or_bot,
            project,
            old_name,
            column if isinstance(column, ProjectColumn) else project,
        )

        return True

    async def change_order(
        self, user: User, project: TProjectParam, project_column: TColumnParam, order: int
    ) -> bool | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        async with DbSession.use_db() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectColumn)
                .where(ProjectColumn.column("project_id") == project.id)
                .order_by(ProjectColumn.column("order").asc())
                .group_by(ProjectColumn.column("id"), ProjectColumn.column("order"))
            )
        columns: list[Project | ProjectColumn] = list(result.all())
        columns.insert(project.archive_column_order, project)

        if project_column == project.ARCHIVE_COLUMN_UID():
            target_column = columns.pop(project.archive_column_order)
        else:
            target_column = None
            project_column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, project_column))
            if not project_column or project_column.project_id != project.id:
                return None
            for column in columns:
                if column.id == project_column.id:
                    target_column = column
                    columns.remove(column)
                    break
            if not target_column:
                return None

        columns.insert(order, target_column)

        async with DbSession.use_db() as db:
            for i, column in enumerate(columns):
                if isinstance(column, Project):
                    column.archive_column_order = i
                else:
                    column.order = i
                await db.update(column)
            await db.commit()

        ProjectColumnPublisher.order_changed(project, cast(ProjectColumn | str, project_column))

        return True
