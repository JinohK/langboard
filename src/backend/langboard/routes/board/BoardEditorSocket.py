from typing import cast
from ...core.ai import BotType
from ...core.caching import Cache
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketDefaultEvent, SocketResponse, SocketTopic, WebSocket
from ...core.security import Auth
from ...core.utils.EdiitorSocketEventCreator import EdiitorSocketEventCreator
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from .scopes import project_role_finder


EDITOR_TYPES = [("card", SocketTopic.Board), ("wiki", SocketTopic.BoardWiki)]


def get_project_uid(ws: WebSocket) -> str | None:
    topics = ws.get_topics()
    for topic in topics:
        if not topic.startswith(f"{SocketTopic.Board.value}:"):
            continue

        return topic.split(":")[1]
    return None


for editor_type, editor_topic in EDITOR_TYPES:

    @AppRouter.socket.on(SocketDefaultEvent.Close)
    async def board_close(ws: WebSocket, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: dict[str, list[int]] | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if not editors:
            return

        for uid, user_ids in editors.items():
            if user.id in user_ids:
                editors[uid] = [editor for editor in user_ids if editor != user.id]
                await ws.publish(
                    topic=editor_topic,
                    topic_id=project_uid,
                    event_response=f"board:{editor_type}:editor:stop:{uid}",
                    data={"user_ids": editors[uid]},
                )
            if not editors[uid]:
                del editors[uid]
        await Cache.set(f"board:{editor_type}:editors:{project_uid}", editors, ttl=24 * 60 * 60)

    @AppRouter.socket.on(f"board:{editor_type}:editor:users")
    @RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
    async def editor_users(
        ws: WebSocket,
        uid: str,
    ):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: dict[str, list[int]] | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        user_ids = editors[uid] if editors and uid in editors else []
        ws.send(
            SocketResponse(
                topic=editor_topic.value,
                topic_id=project_uid,
                event=f"board:{editor_type}:editor:users",
                data={"user_ids": user_ids},
            )
        )

    @AppRouter.socket.on(f"board:{editor_type}:editor:start")
    @RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
    async def editor_start_editing(ws: WebSocket, uid: str, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: dict[str, list[int]] | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if not editors:
            editors = {}
        if uid not in editors:
            editors[uid] = []
        if user.id not in editors[uid]:
            editors[uid].append(cast(int, user.id))
        await Cache.set(f"board:{editor_type}:editors:{project_uid}", editors, ttl=24 * 60 * 60)
        await ws.publish(
            topic=editor_topic,
            topic_id=project_uid,
            event_response=f"board:{editor_type}:editor:start:{uid}",
            data={"user_ids": editors[uid]},
        )

    @AppRouter.socket.on(f"board:{editor_type}:editor:stop")
    @RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
    async def editor_stop_editing(ws: WebSocket, uid: str, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: dict[str, list[int]] | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if editors and uid in editors:
            editors[uid] = [editor for editor in editors[uid] if editor != user.id]
            await Cache.set(f"board:{editor_type}:editors:{project_uid}", editors, ttl=24 * 60 * 60)
        await ws.publish(
            topic=editor_topic,
            topic_id=project_uid,
            event_response=f"board:{editor_type}:editor:stop:{uid}",
            data={"user_ids": editors[uid] if editors else []},
        )

    editor_events = EdiitorSocketEventCreator(BotType.EditorChat, BotType.EditorCopilot, f"board:{editor_type}")
    editor_events.register(RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder))
