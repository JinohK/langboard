from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import Bot, User


@staticclass
class NotificationPublisher(BaseSocketPublisher):
    @staticmethod
    async def notified(target_user_or_bot: User | Bot, notification: dict[str, Any]):
        model = {"notification": notification}
        topic_id = target_user_or_bot.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.UserPrivate,
            topic_id=topic_id,
            event="user:notified",
            data_keys="notification",
        )

        await NotificationPublisher.put_dispather(model, publish_model)
