from typing import Any
from ..core.routing import GLOBAL_TOPIC_ID, SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass


@staticclass
class AppSettingPublisher:
    @staticmethod
    async def setting_created(model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:created",
            data_keys="setting",
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def setting_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def setting_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:deleted:{uid}",
        )

        await SocketPublishService.put_dispather({}, publish_model)

    @staticmethod
    async def selected_setting_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.AppSettings,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:deleted",
            data_keys="uids",
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_created(model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:global-relationship:created",
            data_keys="global_relationships",
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_updated(uid: str, model: dict[str, Any]):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:global-relationship:updated:{uid}",
            data_keys=list(model.keys()),
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def global_relationship_deleted(uid: str):
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event=f"settings:global-relationship:deleted:{uid}",
        )

        await SocketPublishService.put_dispather({}, publish_model)

    @staticmethod
    async def selected_global_relationships_deleted(uids: list[str]):
        model = {"uids": uids}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id=GLOBAL_TOPIC_ID,
            event="settings:global-relationship:deleted",
            data_keys="uids",
        )

        await SocketPublishService.put_dispather(model, publish_model)
