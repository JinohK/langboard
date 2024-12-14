from ...core.ai import BotRunner, BotType
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketResponse, SocketTopic, WebSocket
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


@AppRouter.socket.on("board:chat:available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def is_chat_available(topic: str, topic_id: str):
    try:
        is_available = await BotRunner.is_available(BotType.ProjectChat)
    except Exception:
        is_available = False
    bot_name = BotRunner.get_bot_name(BotType.ProjectChat)
    return SocketResponse(
        event="board:chat:available",
        topic=topic,
        topic_id=topic_id,
        data={"available": is_available, "bot_name": bot_name},
    )


@AppRouter.socket.on("board:chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def project_chat(
    ws: WebSocket, project_uid: str, message: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    stream_or_str = await BotRunner.run(BotType.ProjectChat, {"message": message})
    if not stream_or_str:
        return SocketResponse(
            event="board:chat:available", topic=SocketTopic.Board.value, topic_id=project_uid, data={"available": False}
        )

    user_message = await service.chat_history.create("project", message, filterable=project_uid, sender_id=user.id)
    ws.send(
        SocketResponse(
            event="board:chat:sent",
            topic=SocketTopic.Board.value,
            topic_id=project_uid,
            data={"uid": user_message.uid, "message": message},
        )
    )

    ai_message = await service.chat_history.create("project", "", filterable=project_uid, receiver_id=user.id)

    ws_stream = ws.stream_with_topic(SocketTopic.Board, project_uid, "board:chat:stream")
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
