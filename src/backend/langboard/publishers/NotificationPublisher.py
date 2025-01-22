from typing import Any
from ..core.ai import Bot
from ..core.db import User
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass


@staticclass
class NotificationPublisher:
    @staticmethod
    def notified(target_user_or_bot: User | Bot, notification: dict[str, Any]):
        model = {"notification": notification}
        topic_id = target_user_or_bot.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.UserPrivate,
            topic_id=topic_id,
            event="user:notified",
            data_keys="notification",
        )

        SocketPublishService.put_dispather(model, publish_model)
