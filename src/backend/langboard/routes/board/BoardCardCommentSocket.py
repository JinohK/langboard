from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:comment:added")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_added(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:added:{model["card_uid"]}",
        data={"comment": model["comment"]},
    )


@AppRouter.socket.on("card:comment:updated")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_updated(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    card_uid = model.pop("card_uid")

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:updated:{card_uid}",
        data=model,
    )


@AppRouter.socket.on("card:comment:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_deleted(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:deleted:{model["card_uid"]}",
        data={"comment_uid": model["comment_uid"]},
    )


@AppRouter.socket.on("card:comment:reacted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_comment_reacted(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    card_uid = model.pop("card_uid")

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:comment:reacted:{card_uid}",
        data=model,
    )
