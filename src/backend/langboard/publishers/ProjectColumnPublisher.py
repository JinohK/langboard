from ..core.db import SnowflakeID
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Project, ProjectColumn


@staticclass
class ProjectColumnPublisher:
    @staticmethod
    def created(project: Project, column: ProjectColumn):
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

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def name_changed(project: Project, name: str, column_id: SnowflakeID | str):
        model = {
            "uid": project.ARCHIVE_COLUMN_UID() if isinstance(column_id, str) else column_id.to_short_code(),
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

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def order_changed(project: Project, column: ProjectColumn | str):
        column_uid = column.get_uid() if isinstance(column, ProjectColumn) else project.ARCHIVE_COLUMN_UID()
        column_order = column.order if isinstance(column, ProjectColumn) else project.archive_column_order
        model = {
            "uid": column_uid,
            "order": column_order,
        }

        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:column:order:changed:{topic_id}",
                data_keys=["uid", "order"],
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:column:order:changed:{topic_id}",
                data_keys=["uid", "order"],
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)
