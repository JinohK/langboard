from core.routing import SocketTopic
from core.routing.SocketTopic import GLOBAL_TOPIC_ID
from core.utils.decorators import staticclass
from models import InternalBotSetting
from ..core.publisher import BaseSocketPublisher, SocketPublishModel


@staticclass
class InternalBotPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(setting: InternalBotSetting):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="internal-bot:created",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def updated(setting: InternalBotSetting):
        model = {"uid": setting.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="internal-bot:updated",
            data_keys=list(model.keys()),
        )

        await InternalBotPublisher.put_dispather(model, publish_model)
