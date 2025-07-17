from core.routing import SocketTopic
from core.types import SafeDateTime
from core.utils.decorators import staticclass
from models import Project, ProjectColumn
from ..core.publisher import BaseSocketPublisher, SocketPublishModel


@staticclass
class ProjectColumnPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(project: Project, column: ProjectColumn):
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
                event=f"board:column:created:{topic_id}",
                data_keys="column",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:created:{topic_id}",
                data_keys="column",
            ),
        ]

        await ProjectColumnPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def name_changed(project: Project, column: ProjectColumn, name: str):
        model = {
            "uid": column.get_uid(),
            "name": name,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:column:name:changed:{topic_id}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:name:changed:{topic_id}",
                data_keys=list(model.keys()),
            ),
        ]

        await ProjectColumnPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def order_changed(project: Project, column: ProjectColumn):
        model = {
            "uid": column.get_uid(),
            "order": column.order,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:column:order:changed:{topic_id}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:order:changed:{topic_id}",
                data_keys=list(model.keys()),
            ),
        ]

        await ProjectColumnPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def deleted(
        project: Project,
        column: ProjectColumn,
        archive_column: ProjectColumn,
        archived_at: SafeDateTime,
        count_all_cards_in_column: int,
    ):
        column_uid = column.get_uid()
        model = {
            "uid": column_uid,
            "archive_column_uid": archive_column.get_uid(),
            "archive_column_name": archive_column.name,
            "archived_at": archived_at,
            "count_all_cards_in_column": count_all_cards_in_column,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:column:deleted:{column_uid}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:deleted:{topic_id}",
                data_keys=list(model.keys()),
            ),
        ]

        await ProjectColumnPublisher.put_dispather(model, publish_models)
