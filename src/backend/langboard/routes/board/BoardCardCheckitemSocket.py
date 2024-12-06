from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:checkitem:created")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_created(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:created:{model["card_uid"]}",
        data={"checkitem": model},
    )


@AppRouter.socket.on("card:sub-checkitem:created")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_sub_checkitem_created(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:sub-checkitem:created:{model["checkitem_uid"]}",
        data={"checkitem": model},
    )


@AppRouter.socket.on("card:checkitem:title:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_title_changed(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:title:changed:{model["uid"]}",
        data={"title": model["title"]},
    )


@AppRouter.socket.on("card:checkitem:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_order_changed(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:order:changed:{model["card_uid"]}",
        data=model,
    )


@AppRouter.socket.on("card:sub-checkitem:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_sub_checkitem_order_changed(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    if "to_column_uid" in model:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{model["to_column_uid"]}",
            data={"move_type": "to_column", "uid": model["uid"], "order": model["order"]},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{model["from_column_uid"]}",
            data={"move_type": "from_column", "uid": model["uid"], "order": model["order"]},
        )
    else:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{model["from_column_uid"]}",
            data={"move_type": "in_column", "uid": model["uid"], "order": model["order"]},
        )


@AppRouter.socket.on("card:checkitem:cardified")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_cardified(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:cardified:{model["checkitem_uid"]}",
        data={"new_card": model["new_card"]},
    )
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:created:{model["new_card"]["column_uid"]}",
        data={"card": model["new_card"]},
    )


@AppRouter.socket.on("card:checkitem:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_deleted(ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:deleted:{model["parent_uid"]}",
        data={"uid": model["uid"]},
    )


@AppRouter.socket.on("card:checkitem:timer:started")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_timer_started(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:timer:started:{model["checkitem_uid"]}",
        data={"timer": model["timer"], "acc_time_seconds": model["acc_time_seconds"]},
    )


@AppRouter.socket.on("card:checkitem:timer:stopped")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_timer_stopped(
    ws: WebSocket, project_uid: str, model_id: str, service: Service = Service.scope()
):
    model = await service.socket.get_model(model_id)
    if not model:
        return

    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:timer:stopped:{model["checkitem_uid"]}",
        data={"acc_time_seconds": model["acc_time_seconds"]},
    )
