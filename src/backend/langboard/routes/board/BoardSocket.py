from random import choice
from time import sleep
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("chat:send")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def project_chat(
    ws: WebSocket, project_uid: str, message: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    # TODO: Chat, Implement chat logic
    message_responses = [
        "Hello!",
        "How are you?",
        "I'm fine, thank you!",
        "Goodbye!",
        "See you later!",
        "Good night!",
        "Good morning!",
        "Good afternoon!",
        "Good evening!",
        "Good day!",
        "Good luck!",
        "Have a nice day!",
    ]

    message_response = choice(message_responses)
    buffered = ""

    user_message = await service.chat_history.create("project", message, filterable=project_uid, sender_id=user.id)
    ws.send("chat:sent", {"uid": user_message.uid, "message": message})

    ai_message = await service.chat_history.create("project", "", filterable=project_uid, receiver_id=user.id)

    stream = ws.stream("chat:stream")
    stream.start(data={"uid": ai_message.uid})
    sleep(1)
    for i in range(len(message_response)):
        buffered = message_response[: i + 1]
        stream.buffer(data={"uid": ai_message.uid, "message": buffered})
        sleep(0.2)
    ai_message.message = message_response
    await service.chat_history.update(ai_message)
    stream.end(data={"uid": ai_message.uid, "message": message_response})
