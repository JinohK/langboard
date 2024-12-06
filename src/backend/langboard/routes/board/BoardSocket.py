from ...core.ai import BotRunner, BotType
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
async def board_close(ws: WebSocket, project_uid: str):
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


@AppRouter.socket.on("column:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def column_order_changed(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"column:order:changed:{project_uid}",
        data=model,
    )
