from typing import Any, Sequence
from ..core.ai import Bot
from ..core.db import User
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import ChatTemplate, Project


@staticclass
class ProjectPublisher:
    @staticmethod
    async def updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:details:changed:{topic_id}",
            data_keys=list(model.keys()),
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def assigned_bots_updated(project: Project, bots: Sequence[Bot]):
        model = {"assigned_bots": [bot.api_response() for bot in bots]}
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.BoardWiki]:
            publish_models.append(
                SocketPublishModel(
                    topic=topic,
                    topic_id=topic_id,
                    event=f"board:assigned-bots:updated:{topic_id}",
                    data_keys="assigned_bots",
                )
            )

        await SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    async def assigned_users_updated(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_models: list[SocketPublishModel] = []
        for topic in [SocketTopic.Board, SocketTopic.Dashboard, SocketTopic.BoardWiki]:
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

        await SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    async def bot_roles_updated(project: Project, target_bot: Bot, roles: list[str]):
        topic_id = project.get_uid()
        model = {"bot_uid": target_bot.get_uid(), "roles": roles}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:roles:bot:updated:{topic_id}",
            data_keys=["bot_uid", "roles"],
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def user_roles_updated(project: Project, target_user: User, roles: list[str]):
        topic_id = project.get_uid()
        model = {"user_uid": target_user.get_uid(), "roles": roles}
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:roles:user:updated:{topic_id}",
                data_keys=["user_uid", "roles"],
            ),
            SocketPublishModel(
                topic=SocketTopic.UserPrivate,
                topic_id=target_user.get_uid(),
                event="user:project-roles:updated",
                data_keys="roles",
                custom_data={"project_uid": topic_id},
            ),
        ]

        await SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    async def bot_activation_toggled(project: Project, target_bot: Bot, is_disabled: bool):
        project_uid = project.get_uid()
        bot_uid = target_bot.get_uid()
        model = {"bot_uid": bot_uid, "is_disabled": is_disabled}
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardSettings,
                topic_id=project_uid,
                event=f"board:settings:activation:bot:toggled:{project_uid}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.ProjectBot,
                topic_id=f"{bot_uid}-{project_uid}",
                event=f"project:bot:activation:toggled:{bot_uid}",
                data_keys="is_disabled",
            ),
        ]

        await SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    async def deleted(project: Project):
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

        await SocketPublishService.put_dispather({}, publish_models)

    @staticmethod
    async def chat_template_created(project: Project, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:created:{topic_id}",
            data_keys=list(model.keys()),
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def chat_template_updated(project: Project, template: ChatTemplate, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:updated:{template.get_uid()}",
            data_keys=list(model.keys()),
        )

        await SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    async def chat_template_deleted(project: Project, template_uid: str):
        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:chat:template:deleted:{template_uid}",
        )

        await SocketPublishService.put_dispather({}, publish_model)
