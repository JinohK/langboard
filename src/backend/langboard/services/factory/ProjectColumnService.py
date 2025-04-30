from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...models import Card, Project, ProjectColumn
from ...publishers import ProjectColumnPublisher
from ...tasks.activities import ProjectColumnActivityTask
from ...tasks.bot import ProjectColumnBotTask
from .Types import TColumnParam, TProjectParam, TUserOrBot


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def get_by_uid(self, uid: str) -> ProjectColumn | None:
        return await self._get_by_param(ProjectColumn, uid)

    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[False]) -> list[ProjectColumn]: ...
    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_project(
        self, project: TProjectParam, as_api: bool
    ) -> list[ProjectColumn] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectColumn)
                .where(ProjectColumn.column("project_id") == project.id)
                .order_by(ProjectColumn.column("order").asc())
                .group_by(ProjectColumn.column("id"), ProjectColumn.column("order"))
            )
        raw_columns = result.all()
        columns = []
        has_archive_column = False
        for raw_column in raw_columns:
            columns.append(raw_column.api_response() if as_api else raw_column)
            if raw_column.is_archive:
                has_archive_column = True

        if not has_archive_column:
            archive_column = await self.get_or_create_archive_if_not_exists(project)
            columns.append(archive_column.api_response() if as_api else archive_column)

        return columns

    async def get_or_create_archive_if_not_exists(self, project: Project) -> ProjectColumn:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectColumn).where(
                    (ProjectColumn.column("project_id") == project.id) & ProjectColumn.column("is_archive") == True  # noqa
                )
            )
        archive_column = result.first()
        if archive_column:
            return archive_column

        max_order = await self._get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=project.id,
            name=ProjectColumn.DEFAULT_ARCHIVE_COLUMN_NAME,
            order=max_order + 1,
            is_archive=True,
        )

        async with DbSession.use() as db:
            db.insert(column)
            await db.commit()

        return column

    async def count_cards(self, project: TProjectParam, column: TColumnParam) -> int:
        params = await self.__get_records_by_params(project, column)
        if not params:
            return 0
        project, column = params

        sql_query = SqlBuilder.select.count(Card, Card.id).where(
            (Card.column("project_id") == project.id) & (Card.column("project_column_id") == column.id)
        )
        async with DbSession.use() as db:
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
            order=max_order + 1,
        )

        async with DbSession.use() as db:
            db.insert(column)
            await db.commit()

        ProjectColumnPublisher.created(project, column)
        ProjectColumnActivityTask.project_column_created(user_or_bot, project, column)
        ProjectColumnBotTask.project_column_created(user_or_bot, project, column)

        return column

    async def change_name(
        self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam, name: str
    ) -> bool | None:
        params = await self.__get_records_by_params(project, column)
        if not params:
            return None
        project, column = params

        old_name = column.name
        column.name = name
        async with DbSession.use() as db:
            await db.update(column)
            await db.commit()

        ProjectColumnPublisher.name_changed(project, column, name)
        ProjectColumnActivityTask.project_column_name_changed(user_or_bot, project, old_name, column)
        ProjectColumnBotTask.project_column_name_changed(user_or_bot, project, old_name, column)

        return True

    async def change_order(self, user: User, project: TProjectParam, column: TColumnParam, order: int) -> bool:
        params = await self.__get_records_by_params(project, column)
        if not params:
            return False
        project, column = params

        original_order = column.order
        update_query = SqlBuilder.update.table(ProjectColumn).where(ProjectColumn.column("project_id") == project.id)
        update_query = self._set_order_in_column(update_query, ProjectColumn, original_order, order)
        async with DbSession.use() as db:
            await db.exec(update_query)
            await db.commit()

        column.order = order
        async with DbSession.use() as db:
            await db.update(column)
            await db.commit()

        ProjectColumnPublisher.order_changed(project, column)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam) -> bool:
        params = await self.__get_records_by_params(project, column)
        if not params:
            return False
        project, column = params
        if column.is_archive:
            return False

        archive_column = await self.get_or_create_archive_if_not_exists(project)
        all_cards_in_column = await self._get_all_by(Card, "project_column_id", column.id)
        count_cards_in_column = len(all_cards_in_column)

        current_time = now()

        query = (
            SqlBuilder.update.table(Card)
            .values({Card.order: Card.order + count_cards_in_column})
            .where(Card.column("project_column_id") == archive_column.id)
        )
        async with DbSession.use() as db:
            await db.exec(query)
            await db.commit()

        for i in range(count_cards_in_column):
            card = all_cards_in_column[i]
            card.project_column_id = archive_column.id
            card.archived_at = current_time
            async with DbSession.use() as db:
                await db.update(card)
                await db.commit()

        async with DbSession.use() as db:
            await db.delete(column)
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.update.table(ProjectColumn)
                .values({ProjectColumn.order: ProjectColumn.order - 1})
                .where(
                    (ProjectColumn.column("project_id") == project.id) & (ProjectColumn.column("order") > column.order)
                )
            )
            await db.commit()

        ProjectColumnPublisher.deleted(project, column, archive_column, current_time, count_cards_in_column)
        ProjectColumnActivityTask.project_column_deleted(user_or_bot, project, column)
        ProjectColumnBotTask.project_column_deleted(user_or_bot, project, column)

        return True

    async def __get_records_by_params(self, project: TProjectParam, column: TColumnParam):
        project = cast(Project, await self._get_by_param(Project, project))
        column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
        if not project or not column or column.project_id != project.id:
            return None

        return project, column
