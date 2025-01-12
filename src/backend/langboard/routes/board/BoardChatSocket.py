from time import sleep
from ...core.ai import BotRunner, InternalBotType
from ...core.caching import Cache
from ...core.db import User
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, IWebSocketStream, SocketResponse, SocketTopic, WebSocket
from ...core.security import Auth
from ...models import ChatHistory, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import project_role_finder


@AppRouter.socket.on("board:chat:available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def is_chat_available(topic: str, topic_id: str):
    try:
        is_available = await BotRunner.is_available(InternalBotType.ProjectChat)
    except Exception:
        is_available = False

    if is_available:
        api_bot = {
            "bot_type": InternalBotType.ProjectChat,
            "display_name": InternalBotType.ProjectChat.name,
            "avatar": None,
        }
    else:
        api_bot = None

    return SocketResponse(
        event="board:chat:available",
        topic=topic,
        topic_id=topic_id,
        data={"available": is_available, "bot": api_bot},
    )


@AppRouter.socket.on("board:chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def project_chat(
    ws: WebSocket, topic_id: str, message: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    project = await service.project.get_by_uid(topic_id)
    if not project:
        return

    stream_or_str = await BotRunner.run(InternalBotType.ProjectChat, {"message": message})
    if not stream_or_str:
        return SocketResponse(
            event="board:chat:available",
            topic=SocketTopic.Board.value,
            topic_id=topic_id,
            data={"available": False},
        )

    user_message = await service.chat_history.create("project", message, filterable=topic_id, sender=user.id)

    ws.send(
        SocketResponse(
            event="board:chat:sent",
            topic=SocketTopic.Board.value,
            topic_id=topic_id,
            data={"user_message": user_message.api_response()},
        )
    )

    sleep(1)

    if await stop_chat_if_cancelled(ws, topic_id, service):
        return

    ai_message = await service.chat_history.create("project", "", filterable=topic_id, receiver=user.id)
    ws_stream = ws.stream_with_topic(SocketTopic.Board, topic_id, "board:chat:stream")
    ai_message_uid = ai_message.get_uid()
    ws_stream.start(data={"ai_message": ai_message.api_response()})

    sleep(1)

    if await stop_chat_if_cancelled(ws, topic_id, service, ai_message, ws_stream):
        return

    if isinstance(stream_or_str, str):
        ai_message.message = stream_or_str
        ws_stream.buffer(data={"uid": ai_message_uid, "message": ai_message.message})
    else:
        is_received = False
        async for chunk in stream_or_str:
            if await stop_chat_if_cancelled(ws, topic_id, service, ai_message, ws_stream):
                return

            if not chunk:
                continue

            is_received = True
            ai_message.message = f"{ai_message.message}{chunk}"
            ws_stream.buffer(data={"uid": ai_message_uid, "message": ai_message.message})

        if not is_received:
            is_cancelled = await stop_chat_if_cancelled(ws, topic_id, service, ai_message, ws_stream)
            if not is_cancelled:
                await service.chat_history.delete(ai_message)
                ws_stream.end(data={"uid": ai_message_uid, "status": "failed"})
            return

    await service.chat_history.update(ai_message)
    ws_stream.end(data={"uid": ai_message_uid, "status": "success"})


@AppRouter.socket.on("board:chat:cancel")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def cancel_chat(topic_id: str):
    await Cache.set(f"chat:cancel:{topic_id}", True, 60)


async def stop_chat_if_cancelled(
    ws: WebSocket,
    topic_id: str,
    service: Service,
    ai_message: ChatHistory | None = None,
    stream: IWebSocketStream | None = None,
):
    is_cancelled = await Cache.get(f"chat:cancel:{topic_id}")
    if not is_cancelled:
        return False

    await Cache.delete(f"chat:cancel:{topic_id}")

    if not ai_message:
        ws.send(
            SocketResponse(
                event="board:chat:cancelled",
                topic=SocketTopic.Board.value,
                topic_id=topic_id,
                data={},
            )
        )
        return True

    if ai_message and stream:
        stream.end(data={"uid": ai_message.get_uid(), "status": "cancelled"})
        if not ai_message.message:
            await service.chat_history.delete(ai_message)
        else:
            await service.chat_history.update(ai_message)
    return True
