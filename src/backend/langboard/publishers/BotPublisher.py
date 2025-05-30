from typing import Any
from ..core.ai import Bot
from ..core.routing import GLOBAL_TOPIC_ID, SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass


@staticclass
class BotPublisher:
    @staticmethod
    def bot_created(bot: Bot):
        model = {"bot": bot.api_response(), "setting_bot": bot.api_response(is_setting=True)}
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Global,
                topic_id=GLOBAL_TOPIC_ID,
                event="bot:created",
                data_keys="bot",
            ),
            SocketPublishModel(
                topic=SocketTopic.AppSettings,
                topic_id=GLOBAL_TOPIC_ID,
                event="settings:bot:created",
                data_keys="setting_bot",
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def bot_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def bot_setting_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:bot:updated:{uid}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def bot_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"bot:deleted:{uid}",
        )

        SocketPublishService.put_dispather({}, publish_model)

    @staticmethod
    def bot_condition_predefined(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:bot:trigger-condition:predefined:{uid}",
            data_keys="conditions",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def bot_condition_toggled(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:bot:trigger-condition:toggled:{uid}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)
