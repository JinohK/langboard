from typing import cast
from ...core.ai import BotRunner, BotType
from ...core.ai.BotDataModel import EditorChatDataModel, EditorCopilotDataModel
from ...core.caching import Cache
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketDefaultEvent, SocketResponse, WebSocket
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on(SocketDefaultEvent.Open)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
def board_open(ws: WebSocket, project_uid: str):
    ws.subscribe(f"board:{project_uid}")


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
    ws.unsubscribe(f"board:{project_uid}")


@AppRouter.socket.on("chat:available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def is_chat_available():
    try:
        is_available = await BotRunner.is_available(BotType.ProjectChat)
    except Exception:
        is_available = False
    bot_name = BotRunner.get_bot_name(BotType.ProjectChat)
    return SocketResponse(event="chat:available", data={"available": is_available, "bot_name": bot_name})


@AppRouter.socket.on("chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def project_chat(
    ws: WebSocket, project_uid: str, message: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    stream_or_str = await BotRunner.run(BotType.ProjectChat, {"message": message})
    if not stream_or_str:
        return SocketResponse(event="chat:available", data={"available": False})

    user_message = await service.chat_history.create("project", message, filterable=project_uid, sender_id=user.id)
    ws.send("chat:sent", {"uid": user_message.uid, "message": message})

    ai_message = await service.chat_history.create("project", "", filterable=project_uid, receiver_id=user.id)

    ws_stream = ws.stream("chat:stream")
    ws_stream.start(data={"uid": ai_message.uid})
    if isinstance(stream_or_str, str):
        ai_message.message = stream_or_str
        ws_stream.buffer(data={"uid": ai_message.uid, "message": ai_message.message})
    else:
        async for chunk in stream_or_str:
            if not chunk:
                continue
            ai_message.message = f"{ai_message.message}{chunk}"
            ws_stream.buffer(data={"uid": ai_message.uid, "message": ai_message.message})
    await service.chat_history.update(ai_message)
    ws_stream.end(data={"uid": ai_message.uid, "message": ai_message.message})


@AppRouter.socket.on("card:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_order_changed(ws: WebSocket, project_uid: str, column_uids: list):
    for column_uid in column_uids:
        ws.publish(topic=f"board:{project_uid}", event_response=f"card:order:changed:{column_uid}", data={})


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


@AppRouter.socket.on("card:editor:chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_editor_chat(ws: WebSocket, form: EditorChatDataModel):
    stream_or_str = await BotRunner.run(BotType.EditorChat, form.model_dump())
    ws_stream = ws.stream("card:editor:chat:stream")
    ws_stream.start()
    message = ""
    if not stream_or_str:
        pass
    elif isinstance(stream_or_str, str):
        ws_stream.buffer(data={"message": stream_or_str})
        message = stream_or_str
    else:
        async for chunk in stream_or_str:
            if not chunk:
                continue
            ws_stream.buffer(data={"message": chunk})
            message = f"{message}{chunk}"
    ws_stream.end(data={"message": message})


@AppRouter.socket.on("card:editor:copilot:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def add_copilot_to_card(ws: WebSocket, form: EditorCopilotDataModel, key: str):
    stream_or_str = await BotRunner.run_abortable(BotType.EditorCopilot, form.model_dump(), key)
    if not stream_or_str:
        ws.send(f"card:editor:copilot:receive:{key}", {"text": "0"})
        return

    if isinstance(stream_or_str, str):
        ws.send(f"card:editor:copilot:receive:{key}", {"text": stream_or_str})
    else:
        chunks = []
        async for chunk in stream_or_str:
            if not chunk:
                continue
            chunks.append(chunk)
        ws.send(f"card:editor:copilot:receive:{key}", {"text": "".join(chunks)})


@AppRouter.socket.on("card:editor:copilot:abort")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def abort_copilot(ws: WebSocket, key: str):
    await BotRunner.abort(BotType.EditorCopilot, key)
    ws.send(f"card:editor:copilot:abort:{key}", {"text": "0"})
