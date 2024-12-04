from ...core.filter import RoleFilter
from ...core.routing import AppRouter, WebSocket
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from .Models import ChangeCardDetailsForm, ChangeOrderSocketForm
from .RoleFinder import project_role_finder


AppRouter.socket.use_path("/board/{project_uid}")


@AppRouter.socket.on("card:details:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_details_changed(ws: WebSocket, project_uid: str, card_uid: str, details: ChangeCardDetailsForm):
    event_types = []
    if details.title is not None:
        event_types.append("title")
    if details.deadline_at is not None:
        event_types.append("deadline")
    if details.description is not None:
        event_types.append("description")

    for event_type in event_types:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:{event_type}:changed:{card_uid}",
            data=details.model_dump(),
        )


@AppRouter.socket.on("card:order:changed")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
async def card_order_changed(ws: WebSocket, project_uid: str, form: ChangeOrderSocketForm):
    if form.to_column_uid:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{form.to_column_uid}",
            data={"move_type": "to_column", "uid": form.uid, "order": form.order},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{form.from_column_uid}",
            data={"move_type": "from_column", "uid": form.uid, "order": form.order},
        )
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{form.uid}",
            data={"column_uid": form.to_column_uid, "column_name": form.column_name},
        )
    else:
        ws.publish(
            topic=f"board:{project_uid}",
            event_response=f"card:order:changed:{form.from_column_uid}",
            data={"move_type": "in_column", "uid": form.uid, "order": form.order},
        )
