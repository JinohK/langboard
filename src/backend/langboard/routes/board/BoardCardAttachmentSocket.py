from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:attachment:uploaded")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_uploaded(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    card_uid = model.pop("card_uid")

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:uploaded:{card_uid}",
        data={"attachment": model},
    )


@AppRouter.socket.on("card:attachment:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_order_changed(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    card_uid = model.pop("card_uid")

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:order:changed:{card_uid}",
        data=model,
    )


@AppRouter.socket.on("card:attachment:name:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_changed_name(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:name:changed:{model["uid"]}",
        data={"name": model["name"]},
    )


@AppRouter.socket.on("card:attachment:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_attachment_deleted(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:attachment:deleted:{model["card_uid"]}",
        data=model,
    )
