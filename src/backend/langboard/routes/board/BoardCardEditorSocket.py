from typing import cast
from ...core.ai import BotType
from ...core.caching import Cache
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketDefaultEvent, WebSocket
from ...core.security import Auth
from ...core.utils.EdiitorSocketEventCreator import EdiitorSocketEventCreator
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on(SocketDefaultEvent.Close)
async def board_close(ws: WebSocket, project_uid: str, user: User = Auth.scope("socket")):
    editors: dict[str, list[int]] | None = await Cache.get(f"card:editors:{project_uid}")
    if editors:
        for uid, user_ids in editors.items():
            if user.id in user_ids:
                editors[uid] = [editor for editor in user_ids if editor != user.id]
                ws.publish(
                    topic=f"board:{project_uid}",
                    event_response=f"card:editor:stop:{uid}",
                    data={"user_ids": editors[uid]},
                )
            if not editors[uid]:
                del editors[uid]
        await Cache.set(f"card:editors:{project_uid}", editors, ttl=24 * 60 * 60)


@AppRouter.socket.on("card:editor:users")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_editor_users(
    ws: WebSocket,
    project_uid: str,
    uid: str,
):
    editors: dict[str, list[int]] | None = await Cache.get(f"card:editors:{project_uid}")
    user_ids = editors[uid] if editors and uid in editors else []
    ws.send(f"card:editor:users:{uid}", {"user_ids": user_ids})


@AppRouter.socket.on("card:editor:start")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_editor_start_editing(ws: WebSocket, project_uid: str, uid: str, user: User = Auth.scope("socket")):
    editors: dict[str, list[int]] | None = await Cache.get(f"card:editors:{project_uid}")
    if not editors:
        editors = {}
    if uid not in editors:
        editors[uid] = []
    if user.id not in editors[uid]:
        editors[uid].append(cast(int, user.id))
    await Cache.set(f"card:editors:{project_uid}", editors, ttl=24 * 60 * 60)
    ws.publish(topic=f"board:{project_uid}", event_response=f"card:editor:start:{uid}", data={"user_ids": editors[uid]})


@AppRouter.socket.on("card:editor:stop")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_editor_stop_editing(ws: WebSocket, project_uid: str, uid: str, user: User = Auth.scope("socket")):
    editors: dict[str, list[int]] | None = await Cache.get(f"card:editors:{project_uid}")
    if editors and uid in editors:
        editors[uid] = [editor for editor in editors[uid] if editor != user.id]
        await Cache.set(f"card:editors:{project_uid}", editors, ttl=24 * 60 * 60)
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:editor:stop:{uid}",
        data={"user_ids": editors[uid] if editors else []},
    )


card_editor_events = EdiitorSocketEventCreator(BotType.EditorChat, BotType.EditorCopilot, "card")
card_editor_events.register(RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder))
