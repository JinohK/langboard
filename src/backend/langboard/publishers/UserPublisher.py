from typing import Any
from ..core.db import User
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass


@staticclass
class UserPublisher:
    @staticmethod
    def updated(user: User, model: dict[str, Any]):
        topic_id = user.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.User,
            topic_id=topic_id,
            event="user:updated",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)
