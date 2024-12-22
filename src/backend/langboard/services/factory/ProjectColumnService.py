from typing import Any, cast
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...models import Card, Project, ProjectColumn
from .Types import TColumnParam, TProjectParam


_SOCKET_PREFIX = "project:column"


class ProjectColumnService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_column"

    async def get_list(self, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectColumn)
            .where(ProjectColumn.column("project_id") == project.id)
            .order_by(ProjectColumn.column("order").asc())
            .group_by(ProjectColumn.column("order"))
        )
        raw_columns = result.all()
        columns = [raw_column.api_response() for raw_column in raw_columns]
        columns.insert(
            project.archive_column_order,
            {
                "uid": Project.ARCHIVE_COLUMN_UID,
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
            if isinstance(column_id, str) and column_id != Project.ARCHIVE_COLUMN_UID
            else column_id
        )
        sql_query = self._db.query("select").count(Card, Card.id).where(Card.column("project_id") == project.id)
        if column_id == Project.ARCHIVE_COLUMN_UID:
            sql_query = sql_query.where(Card.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.where(Card.column("project_column_id") == column_id)
        result = await self._db.exec(sql_query)
        count = result.one()
        return count

    async def create(
        self, user: User, project: TProjectParam, name: str
    ) -> SocketModelIdBaseResult[ProjectColumn] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        max_order = await self._get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=project.id,
            name=name,
            order=max_order + 2,  # due to the archive column, the order is incremented by 2
        )

        self._db.insert(column)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {
                "column": {
                    **column.api_response(),
                    "count": 0,
                }
            }
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Project,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:created:{project.get_uid()}",
            data_keys="column",
        )

        return SocketModelIdBaseResult(model_id, column, publish_model)

    async def change_name(
        self, user: User, project: TProjectParam, column: TColumnParam, name: str
    ) -> SocketModelIdBaseResult[bool] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        if column == Project.ARCHIVE_COLUMN_UID:
            # original_name = project.archive_column_name
            project.archive_column_name = name
            await self._db.update(project)
            column_id = Project.ARCHIVE_COLUMN_UID
        else:
            column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
            if not column or column.project_id != project.id:
                return None
            # original_name = column.name
            column.name = name
            await self._db.update(column)
            column_id = column.id

        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {
                "uid": Project.ARCHIVE_COLUMN_UID if isinstance(column_id, str) else column_id.to_short_code(),
                "name": name,
            }
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Project,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:name:changed:{project.get_uid()}",
            data_keys=["uid", "name"],
        )

        return SocketModelIdBaseResult(model_id, True, publish_model)

    async def change_order(
        self, user: User, project: TProjectParam, project_column: TColumnParam, order: int
    ) -> SocketModelIdBaseResult[bool] | None:
        project = cast(Project, await self._get_by_param(Project, project))
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

        if project_column == Project.ARCHIVE_COLUMN_UID:
            # original_column_order = project.archive_column_order
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

        model_id = await SocketModelIdService.create_model_id(
            {
                "uid": project_column.get_uid()
                if isinstance(project_column, ProjectColumn)
                else Project.ARCHIVE_COLUMN_UID,
                "order": order,
            }
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Project,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:order:changed:{project.get_uid()}",
            data_keys=["uid", "order"],
        )

        return SocketModelIdBaseResult(model_id, True, publish_model)
