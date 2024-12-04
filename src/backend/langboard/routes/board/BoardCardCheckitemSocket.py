from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .Models import ChangeColumnOrderSocketForm, ChangeOrderSocketForm
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:checkitem:created")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_created(ws: WebSocket, project_uid: str, card_uid: str, checkitem: dict):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:created:{card_uid}",
        data={"checkitem": checkitem},
    )


@AppRouter.socket.on("card:sub-checkitem:created")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_sub_checkitem_created(ws: WebSocket, project_uid: str, checkitem_uid: str, checkitem: dict):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:sub-checkitem:created:{checkitem_uid}",
        data={"checkitem": checkitem},
    )


@AppRouter.socket.on("card:checkitem:title:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_title_changed(ws: WebSocket, project_uid: str, checkitem_uid: str, title: str):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:title:changed:{checkitem_uid}",
        data={"uid": checkitem_uid, "title": title},
    )


@AppRouter.socket.on("card:checkitem:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_order_changed(
    ws: WebSocket, project_uid: str, card_uid: str, form: ChangeColumnOrderSocketForm
):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:order:changed:{card_uid}",
        data={"uid": form.uid, "order": form.order},
    )


@AppRouter.socket.on("card:sub-checkitem:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_sub_checkitem_order_changed(ws: WebSocket, project_uid: str, form: ChangeOrderSocketForm):
    if form.to_column_uid:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{form.to_column_uid}",
            data={"move_type": "to_column", "uid": form.uid, "order": form.order},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{form.from_column_uid}",
            data={"move_type": "from_column", "uid": form.uid, "order": form.order},
        )
    else:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:sub-checkitem:order:changed:{form.from_column_uid}",
            data={"move_type": "in_column", "uid": form.uid, "order": form.order},
        )


@AppRouter.socket.on("card:checkitem:cardified")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_cardified(ws: WebSocket, project_uid: str, checkitem_uid: str, new_card: dict):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:cardified:{checkitem_uid}",
        data={"new_card": new_card},
    )
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:created:{new_card["column_uid"]}",
        data={"card": new_card},
    )


@AppRouter.socket.on("card:checkitem:deleted")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_deleted(ws: WebSocket, project_uid: str, parent_uid: str, checkitem_uid: str):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:deleted:{parent_uid}",
        data={"uid": checkitem_uid},
    )


@AppRouter.socket.on("card:checkitem:timer:started")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_timer_started(
    ws: WebSocket, project_uid: str, checkitem_uid: str, timer: dict, acc_time_seconds: int
):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:timer:started:{checkitem_uid}",
        data={"timer": timer, "acc_time_seconds": acc_time_seconds},
    )


@AppRouter.socket.on("card:checkitem:timer:stopped")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_checkitem_timer_stopped(ws: WebSocket, project_uid: str, checkitem_uid: str, acc_time_seconds: int):
    ws.publish(
        topic=f"board:{project_uid}",
        event_response=f"card:checkitem:timer:stopped:{checkitem_uid}",
        data={"acc_time_seconds": acc_time_seconds},
    )
