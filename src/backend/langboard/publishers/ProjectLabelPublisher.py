from typing import Any
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Project, ProjectLabel


@staticclass
class ProjectLabelPublisher:
    @staticmethod
    def created(project: Project, label: ProjectLabel):
        model = {"label": label.api_response()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:label:created:{project.get_uid()}",
            data_keys="label",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def updated(project: Project, label: ProjectLabel, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:details:changed:{label.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def order_changed(project: Project, label: ProjectLabel):
        topic_id = project.get_uid()
        model = {"uid": label.get_uid(), "order": label.order}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:order:changed:{topic_id}",
            data_keys=["uid", "order"],
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def deleted(project: Project, label: ProjectLabel):
        topic_id = project.get_uid()
        model = {"uid": label.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:label:deleted:{topic_id}",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)
