from ...core.db import EditorContentModel
from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:comment:added")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_added(ws: WebSocket, project_uid: str, card_uid: str, comment: dict):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:added:{card_uid}",
        data={"comment": comment},
    )


@AppRouter.socket.on("card:comment:updated")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_updated(
    ws: WebSocket, project_uid: str, card_uid: str, comment_uid: str, content: EditorContentModel, commented_at: str
):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:updated:{card_uid}",
        data={"comment_uid": comment_uid, "content": content.model_dump(), "commented_at": commented_at},
    )


@AppRouter.socket.on("card:comment:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_deleted(ws: WebSocket, project_uid: str, card_uid: str, comment_uid: str):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:deleted:{card_uid}",
        data={"comment_uid": comment_uid},
    )


@AppRouter.socket.on("card:comment:reacted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_reacted(
    ws: WebSocket, project_uid: str, card_uid: str, user_id: int, comment_uid: str, reaction: str, is_reacted: bool
):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:reacted:{card_uid}",
        data={"user_id": user_id, "comment_uid": comment_uid, "reaction": reaction, "is_reacted": is_reacted},
    )
