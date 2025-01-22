from typing import Any
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Card, Project


@staticclass
class CardRelationshipPublisher:
    @staticmethod
    def updated(project: Project, card: Card, relationships: list[dict[str, Any]]):
        model = {
            "card_uid": card.get_uid(),
            "relationships": relationships,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:relationships:updated:{project.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)
