from typing import Any, Sequence
from ..core.ai import Bot
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Project


@staticclass
class ProjectPublisher:
    @staticmethod
    def updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:details:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def assigned_bots_updated(project: Project, bots: Sequence[Bot]):
        model = {"assigned_bots": [bot.api_response() for bot in bots]}
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.BoardCard, SocketTopic.BoardWiki]:
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"board:assigned-bots:updated:{topic_id}",
                    data_keys="assigned_bots",
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def assigned_users_updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.Dashboard, SocketTopic.BoardCard, SocketTopic.BoardWiki]:
            event_prefix = "board" if topic != SocketTopic.Dashboard else "dashboard:project"
            data_keys = "assigned_members" if topic != SocketTopic.Board else ["assigned_members", "invited_members"]
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"{event_prefix}:assigned-users:updated:{topic_id}",
                    data_keys=data_keys,
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def deleted(project: Project):
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.Dashboard]:
            event_prefix = "board" if topic != SocketTopic.Dashboard else "dashboard:project"
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"{event_prefix}:deleted:{topic_id}",
                )
            )

        SocketPublishService.put_dispather({}, publish_models)
