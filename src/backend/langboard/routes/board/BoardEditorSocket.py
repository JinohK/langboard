from ...core.ai import InternalBotType
from ...core.caching import Cache
from ...core.db import User
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketDefaultEvent, SocketResponse, SocketTopic, WebSocket
from ...core.security import Auth
from ...core.utils.EdiitorSocketEventCreator import EdiitorSocketEventCreator
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .scopes import project_role_finder


EDITOR_TYPES = [("card", SocketTopic.Board), ("wiki", SocketTopic.BoardWiki)]
_TEditorCache = dict[str, list[str]]


def get_project_uid(ws: WebSocket) -> str | None:
    topics = ws.get_topics()
    for topic in topics:
        if not topic.startswith(f"{SocketTopic.Board.value}:"):
            continue

        return topic.split(":")[1]
    return None


def register_board_editor(editor_type: str, editor_topic: SocketTopic):
    @AppRouter.socket.on(SocketDefaultEvent.Close)
    async def board_close(ws: WebSocket, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: _TEditorCache | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if not editors:
            return

        current_user_uid = user.get_uid()
        for uid, user_uids in editors.items():
            if current_user_uid in user_uids:
                editors[uid] = [user_uid for user_uid in user_uids if user_uid != current_user_uid]
                await AppRouter.publish(
                    topic=editor_topic,
                    topic_id=project_uid,
                    event_response=f"board:{editor_type}:editor:stop:{uid}",
                    data={"user_uids": editors[uid]},
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

        editors: _TEditorCache | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        user_uids = editors[uid] if editors and uid in editors else []
        ws.send(
            SocketResponse(
                topic=editor_topic.value,
                topic_id=project_uid,
                event=f"board:{editor_type}:editor:users",
                data={"user_uids": user_uids},
            )
        )

    @AppRouter.socket.on(f"board:{editor_type}:editor:start")
    @RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
    async def editor_start_editing(ws: WebSocket, uid: str, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: _TEditorCache | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if not editors:
            editors = {}
        if uid not in editors:
            editors[uid] = []
        if user.id not in editors[uid]:
            editors[uid].append(user.get_uid())
        await Cache.set(f"board:{editor_type}:editors:{project_uid}", editors, ttl=24 * 60 * 60)
        await AppRouter.publish(
            topic=editor_topic,
            topic_id=project_uid,
            event_response=f"board:{editor_type}:editor:start:{uid}",
            data={"user_uids": editors[uid]},
        )

    @AppRouter.socket.on(f"board:{editor_type}:editor:stop")
    @RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
    async def editor_stop_editing(ws: WebSocket, uid: str, user: User = Auth.scope("socket")):
        project_uid = get_project_uid(ws)
        if not project_uid:
            return

        editors: _TEditorCache | None = await Cache.get(f"board:{editor_type}:editors:{project_uid}")
        if editors and uid in editors:
            editors[uid] = [editor for editor in editors[uid] if editor != user.id]
            await Cache.set(f"board:{editor_type}:editors:{project_uid}", editors, ttl=24 * 60 * 60)
        await AppRouter.publish(
            topic=editor_topic,
            topic_id=project_uid,
            event_response=f"board:{editor_type}:editor:stop:{uid}",
            data={"user_uids": editors[uid] if editors else []},
        )

    editor_events = EdiitorSocketEventCreator(
        InternalBotType.EditorChat, InternalBotType.EditorCopilot, f"board:{editor_type}"
    )
    editor_events.register(RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder))


for editor_type, editor_topic in EDITOR_TYPES:
    register_board_editor(editor_type, editor_topic)
