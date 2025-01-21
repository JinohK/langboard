from typing import Any, cast
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...models import Card, Project, ProjectColumn
from ...tasks import ProjectColumnActivityTask
from .Types import TColumnParam, TProjectParam, TUserOrBot


_SOCKET_PREFIX = "board:column"


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
        sql_query = self._db.query("select").count(Card, Card.id).where(Card.column("project_id") == project.id)
        if column_id == project.ARCHIVE_COLUMN_UID():
            sql_query = sql_query.where(Card.column("archived_at") != None)  # noqa
        else:
            sql_query = sql_query.where(Card.column("project_column_id") == column_id)
        result = await self._db.exec(sql_query)
        count = result.one()
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

        self._db.insert(column)
        await self._db.commit()

        model = {
            "column": {
                **column.api_response(),
                "count": 0,
            }
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"{_SOCKET_PREFIX}:created:{topic_id}",
                data_keys="column",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:created{topic_id}",
                data_keys="column",
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

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
            await self._db.update(project)
            column_id = project.ARCHIVE_COLUMN_UID()
        else:
            column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
            if not column or column.project_id != project.id:
                return None
            old_name = column.name
            column.name = name
            await self._db.update(column)
            column_id = column.id

        await self._db.commit()

        model = {
            "uid": project.ARCHIVE_COLUMN_UID() if isinstance(column_id, str) else column_id.to_short_code(),
            "name": name,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"{_SOCKET_PREFIX}:name:changed:{topic_id}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:name:changed{topic_id}",
                data_keys=list(model.keys()),
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

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

        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectColumn)
            .where(ProjectColumn.column("project_id") == project.id)
            .order_by(ProjectColumn.column("order").asc())
            .group_by(ProjectColumn.column("id"), ProjectColumn.column("order"))
        )
        columns: list[Project | ProjectColumn] = list(result.all())
        columns.insert(project.archive_column_order, project)

        if project_column == project.ARCHIVE_COLUMN_UID():
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

        model = {
            "uid": project_column.get_uid()
            if isinstance(project_column, ProjectColumn)
            else project.ARCHIVE_COLUMN_UID(),
            "order": order,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"{_SOCKET_PREFIX}:order:changed:{topic_id}",
                data_keys=["uid", "order"],
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:order:changed{topic_id}",
                data_keys=["uid", "order"],
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

        return True
