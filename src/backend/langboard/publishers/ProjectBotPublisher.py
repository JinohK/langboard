from typing import Any
from core.routing import SocketTopic
from core.utils.decorators import staticclass
from models import Bot, BotSchedule, Project
from ..core.publisher import BaseSocketPublisher, SocketPublishModel


@staticclass
class ProjectBotPublisher(BaseSocketPublisher):
    @staticmethod
    async def scheduled(project: Project, bot: Bot, schedule: BotSchedule):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardSettings,
            topic_id=topic_id,
            event=f"board:settings:bot:cron:scheduled:{bot.get_uid()}",
            data_keys="schedule",
        )

        model = {"schedule": schedule.api_response()}
        await ProjectBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def rescheduled(project: Project, schedule: BotSchedule, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardSettings,
            topic_id=topic_id,
            event=f"board:settings:bot:cron:rescheduled:{schedule.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ProjectBotPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted(project: Project, schedule: BotSchedule):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardSettings,
            topic_id=topic_id,
            event=f"board:settings:bot:cron:deleted:{schedule.get_uid()}",
            data_keys="uid",
        )

        model = {"uid": schedule.get_uid()}
        await ProjectBotPublisher.put_dispather(model, publish_model)
