from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketResponse, WebSocket
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.Bot import BotType
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("chat:available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def is_chat_available(service: Service = Service.scope()):
    is_available, bot_name = await service.bot.is_available(BotType.ProjectChat)
    return SocketResponse(event="chat:available", data={"available": is_available, "bot_name": bot_name})


@AppRouter.socket.on("chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def project_chat(
    ws: WebSocket, project_uid: str, message: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    stream = await service.bot.send_chat(BotType.ProjectChat, message, use_stream=True)
    if not stream:
        return SocketResponse(event="chat:available", data={"available": False})

    user_message = await service.chat_history.create("project", message, filterable=project_uid, sender_id=user.id)
    ws.send("chat:sent", {"uid": user_message.uid, "message": message})

    ai_message = await service.chat_history.create("project", "", filterable=project_uid, receiver_id=user.id)

    ws_stream = ws.stream("chat:stream")
    ws_stream.start(data={"uid": ai_message.uid})
    async for chunk_dict in stream:
        if "chunk" not in chunk_dict:
            continue
        ai_message.message = f"{ai_message.message}{chunk_dict["chunk"]}"
        ws_stream.buffer(data={"uid": ai_message.uid, "message": ai_message.message})
    await service.chat_history.update(ai_message)
    ws_stream.end(data={"uid": ai_message.uid, "message": ai_message.message})
