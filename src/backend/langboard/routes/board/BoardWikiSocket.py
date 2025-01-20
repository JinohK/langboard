from ...core.db import User
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, SocketResponse, SocketTopic
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import project_role_finder


@AppRouter.socket.on("board:wiki:details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def get_board_wiki_details(
    topic: str, topic_id: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    if topic != SocketTopic.BoardWikiPrivate.value:
        return

    wiki = await service.project_wiki.get_by_uid(topic_id)
    if not wiki:
        return

    is_assigned = await service.project_wiki.is_assigned(user, wiki)
    if not is_assigned:
        return

    api_wiki = await service.project_wiki.convert_to_api_response(user, wiki)

    return SocketResponse(
        event=f"board:wiki:details:{topic_id}",
        topic=topic,
        topic_id=topic_id,
        data={"wiki": api_wiki},
    )
