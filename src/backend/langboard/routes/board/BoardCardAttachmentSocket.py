from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .Models import ChangeColumnOrderSocketForm
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:attachment:uploaded")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_uploaded(ws: WebSocket, project_uid: str, card_uid: str, attachment: dict):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:uploaded:{card_uid}",
        data={"attachment": attachment},
    )


@AppRouter.socket.on("card:attachment:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_order_changed(
    ws: WebSocket, project_uid: str, card_uid: str, form: ChangeColumnOrderSocketForm
):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:order:changed:{card_uid}",
        data={"uid": form.uid, "order": form.order},
    )


@AppRouter.socket.on("card:attachment:name:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_changed_name(ws: WebSocket, project_uid: str, attachment_uid: str, attachment_name: str):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:name:changed:{attachment_uid}",
        data={"uid": attachment_uid, "name": attachment_name},
    )


@AppRouter.socket.on("card:attachment:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_deleted(ws: WebSocket, project_uid: str, card_uid: str, attachment_uid: str):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:deleted:{card_uid}",
        data={"uid": attachment_uid},
    )
