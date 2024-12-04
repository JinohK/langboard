from fastapi import Depends, status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import ChangeColumnOrderForm, ChatHistoryPagination
from .RoleFinder import project_role_finder


@AppRouter.api.post("/board/{project_uid}/available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def is_project_available(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    await service.project.set_last_view(user, project)
    response = project.api_response()
    response["members"] = await service.project.get_assigned_users(project)
    response["current_user_role_actions"] = await service.project.get_user_role_actions(user, project)
    return JsonResponse(content={"project": response}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}/chat")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_chat(
    project_uid: str,
    query: ChatHistoryPagination = Depends(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    histories = await service.chat_history.get_list(user, "project", query.current_date, query, project_uid)

    return JsonResponse(content={"histories": histories}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/chat/clear")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def clear_project_chat(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    await service.chat_history.clear(user, "project", project_uid)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}/cards")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_cards(
    project_uid: str,
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    columns = await service.project.get_columns(project)
    cards = await service.card.get_board_list(project_uid)
    return JsonResponse(content={"cards": cards, "columns": columns}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/column/{column_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_column_order(
    project_uid: str,
    column_uid: str,
    form: ChangeColumnOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.project_column.change_order(user, project_uid, column_uid, form.order)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
