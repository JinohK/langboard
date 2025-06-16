from typing import Any, Literal, cast, overload
from sqlalchemy import func
from ...core.db import DbSession, SqlBuilder
from ...core.service import BaseService, ServiceHelper
from ...core.types import SafeDateTime, SnowflakeID
from ...models import Card, Project, ProjectColumn, User
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
        return ServiceHelper.get_by_param(ProjectColumn, uid)

    @overload
    async def get_all_by_project(self, project: TProjectParam, as_api: Literal[False]) -> list[ProjectColumn]: ...
    @overload
    async def get_all_by_project(
        self, project: TProjectParam, as_api: Literal[False], with_count: Literal[False]
    ) -> list[ProjectColumn]: ...
    @overload
    async def get_all_by_project(
        self, project: TProjectParam, as_api: Literal[False], with_count: Literal[True]
    ) -> tuple[list[ProjectColumn], dict[SnowflakeID, int]]: ...
    @overload
    async def get_all_by_project(
        self, project: TProjectParam, as_api: Literal[True], with_count: bool = False
    ) -> list[dict[str, Any]]: ...
    async def get_all_by_project(
        self, project: TProjectParam, as_api: bool, with_count: bool = False
    ) -> list[ProjectColumn] | tuple[list[ProjectColumn], dict[SnowflakeID, int]] | list[dict[str, Any]]:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return []
        if with_count:
            sql_query = SqlBuilder.select.tables(ProjectColumn, func.count(Card.column("id")).label("count")).outerjoin(
                Card,
                (Card.column("project_column_id") == ProjectColumn.column("id")) & (Card.column("deleted_at") == None),  # noqa
            )
        else:
            sql_query = SqlBuilder.select.table(ProjectColumn)

        sql_query = (
            sql_query.where(ProjectColumn.column("project_id") == project.id)
            .order_by(ProjectColumn.column("order").asc())
            .group_by(ProjectColumn.column("id"), ProjectColumn.column("order"))
        )

        raw_columns = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            raw_columns = result.all()
        columns = []
        count_dict = {}
        has_archive_column = False
        for raw_column in raw_columns:
            if with_count:
                raw_column, count = cast(tuple[ProjectColumn, int], raw_column)
            else:
                raw_column = cast(ProjectColumn, raw_column)
                count = None

            columns.append({**raw_column.api_response(), "count": count} if as_api else raw_column)
            if not as_api:
                count_dict[raw_column.id] = count
            if raw_column.is_archive:
                has_archive_column = True

        if not has_archive_column:
            archive_column = await self.get_or_create_archive_if_not_exists(project)
            if as_api:
                archive_column = archive_column.api_response()
                archive_column["count"] = 0 if as_api and with_count else None
            elif with_count:
                count_dict[archive_column.id] = 0
            columns.append(archive_column)

        if not as_api and with_count:
            return columns, count_dict
        return columns

    async def get_or_create_archive_if_not_exists(self, project: Project) -> ProjectColumn:
        archive_column = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(ProjectColumn).where(
                    (ProjectColumn.column("project_id") == project.id) & ProjectColumn.column("is_archive") == True  # noqa
                )
            )
            archive_column = result.first()
        if archive_column:
            return archive_column

        max_order = ServiceHelper.get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=project.id,
            name=ProjectColumn.DEFAULT_ARCHIVE_COLUMN_NAME,
            order=max_order + 1,
            is_archive=True,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(column)

        return column

    async def count_cards(self, project: TProjectParam, column: TColumnParam) -> int:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return 0
        project, column = params

        sql_query = SqlBuilder.select.count(Card, Card.id).where(
            (Card.column("project_id") == project.id) & (Card.column("project_column_id") == column.id)
        )
        count = 0
        with DbSession.use(readonly=True) as db:
            result = db.exec(sql_query)
            count = result.first() or 0
        return count

    async def create(self, user_or_bot: TUserOrBot, project: TProjectParam, name: str) -> ProjectColumn | None:
        project = ServiceHelper.get_by_param(Project, project)
        if not project:
            return None

        max_order = ServiceHelper.get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=project.id,
            name=name,
            order=max_order + 1,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(column)

        await ProjectColumnPublisher.created(project, column)
        ProjectColumnActivityTask.project_column_created(user_or_bot, project, column)
        ProjectColumnBotTask.project_column_created(user_or_bot, project, column)

        return column

    async def change_name(
        self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam, name: str
    ) -> bool | None:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return None
        project, column = params

        old_name = column.name
        column.name = name
        with DbSession.use(readonly=False) as db:
            db.update(column)

        await ProjectColumnPublisher.name_changed(project, column, name)
        ProjectColumnActivityTask.project_column_name_changed(user_or_bot, project, old_name, column)
        ProjectColumnBotTask.project_column_name_changed(user_or_bot, project, column)

        return True

    async def change_order(self, user: User, project: TProjectParam, column: TColumnParam, order: int) -> bool:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return False
        project, column = params

        original_order = column.order
        update_query = SqlBuilder.update.table(ProjectColumn).where(ProjectColumn.column("project_id") == project.id)
        update_query = ServiceHelper.set_order_in_column(update_query, ProjectColumn, original_order, order)
        with DbSession.use(readonly=False) as db:
            # Lock
            db.exec(
                SqlBuilder.select.table(ProjectColumn)
                .where(ProjectColumn.column("project_id") == project.id)
                .with_for_update()
            ).all()

            db.exec(update_query)
            column.order = order
            db.update(column)

        await ProjectColumnPublisher.order_changed(project, column)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam) -> bool:
        params = ServiceHelper.get_records_with_foreign_by_params((Project, project), (ProjectColumn, column))
        if not params:
            return False
        project, column = params
        if column.is_archive:
            return False

        archive_column = await self.get_or_create_archive_if_not_exists(project)
        all_cards_in_column = ServiceHelper.get_all_by(Card, "project_column_id", column.id)
        count_cards_in_column = len(all_cards_in_column)

        current_time = SafeDateTime.now()

        query = (
            SqlBuilder.update.table(Card)
            .values({Card.order: Card.order + count_cards_in_column})
            .where(Card.column("project_column_id") == archive_column.id)
        )
        with DbSession.use(readonly=False) as db:
            db.exec(query)

            for i in range(count_cards_in_column):
                card = all_cards_in_column[i]
                card.project_column_id = archive_column.id
                card.archived_at = current_time
                with DbSession.use(readonly=False) as db:
                    db.update(card)

        with DbSession.use(readonly=False) as db:
            db.delete(column)

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.update.table(ProjectColumn)
                .values({ProjectColumn.order: ProjectColumn.order - 1})
                .where(
                    (ProjectColumn.column("project_id") == project.id) & (ProjectColumn.column("order") > column.order)
                )
            )

        await ProjectColumnPublisher.deleted(project, column, archive_column, current_time, count_cards_in_column)
        ProjectColumnActivityTask.project_column_deleted(user_or_bot, project, column)
        ProjectColumnBotTask.project_column_deleted(user_or_bot, project, column)

        return True
