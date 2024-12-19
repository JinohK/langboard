from typing import cast
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...models import (
    Card,
    Project,
    ProjectColumn,
    User,
)
from .Types import TColumnParam, TProjectParam


_SOCKET_PREFIX = "board:column"


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

    async def create(
        self, user: User, project: TProjectParam, name: str
    ) -> SocketModelIdBaseResult[ProjectColumn] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        max_order = await self._get_max_order(ProjectColumn, "project_id", project.id)

        column = ProjectColumn(
            project_id=cast(int, project.id),
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
            topic_id=project.uid,
            event=f"project:column:created:{project.uid}",
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
            column_uid = Project.ARCHIVE_COLUMN_UID
        else:
            column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
            if not column or column.project_id != project.id:
                return None
            # original_name = column.name
            column.name = name
            await self._db.update(column)
            column_uid = column.uid

        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {
                "uid": column_uid,
                "name": name,
            }
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Project,
            topic_id=project.uid,
            event=f"project:column:name:changed:{project.uid}",
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
                if column.uid == project_column.uid:
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
                "uid": project_column.uid if isinstance(project_column, ProjectColumn) else Project.ARCHIVE_COLUMN_UID,
                "order": order,
            }
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Project,
            topic_id=project.uid,
            event=f"project:column:order:changed:{project.uid}",
            data_keys=["uid", "order"],
        )

        return SocketModelIdBaseResult(model_id, True, publish_model)
