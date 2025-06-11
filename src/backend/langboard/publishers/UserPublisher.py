from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import User


@staticclass
class UserPublisher(BaseSocketPublisher):
    @staticmethod
    async def updated(user: User, model: dict[str, Any]):
        topic_id = user.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.User,
            topic_id=topic_id,
            event="user:updated",
            data_keys=list(model.keys()),
        )

        await UserPublisher.put_dispather(model, publish_model)
