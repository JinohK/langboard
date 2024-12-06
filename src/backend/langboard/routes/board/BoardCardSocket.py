from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:details:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_details_changed(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    card_uid = model.pop("card_uid")

    for key in model:
        if ["title", "deadline_at", "description"].count(key) == 0:
            continue
        value = model[key]
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:{key}:changed:{card_uid}",
            data=value,
        )


@AppRouter.socket.on("card:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_order_changed(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    if "to_column_uid" in model:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{model["to_column_uid"]}",
            data={"move_type": "to_column", "uid": model["uid"], "order": model["order"]},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{model["from_column_uid"]}",
            data={"move_type": "from_column", "uid": model["uid"], "order": model["order"]},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{model["uid"]}",
            data={"column_uid": model["to_column_uid"], "column_name": model["column_name"]},
        )
    else:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{model["from_column_uid"]}",
            data={"move_type": "in_column", "uid": model["uid"], "order": model["order"]},
        )
