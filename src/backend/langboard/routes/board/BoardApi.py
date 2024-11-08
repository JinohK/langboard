from fastapi import Depends, status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema.Pagination import Pagination
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import ChangeTaskOrderForm, ChatHistoryPagination
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
    columns = await service.project.get_columns(project)
    members = await service.project.get_assigned_users(project)
    current_user_role_actions = await service.project.get_user_role_actions(user, project)
    project = project.model_dump()
    project["columns"] = columns
    project["members"] = members
    project["current_user_role_actions"] = current_user_role_actions
    project.pop("created_at", None)
    project.pop("updated_at", None)
    project.pop("deleted_at", None)
    return JsonResponse(content={"project": project}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}/chat")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_chat(
    project_uid: str,
    query: ChatHistoryPagination = Depends(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    histories, total = await service.chat_history.get_list(user, "project", query.current_date, query, project_uid)

    return JsonResponse(content={"histories": histories, "total": total}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/chat/clear")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def clear_project_chat(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    await service.chat_history.clear(user, "project", project_uid)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}/column/{column_uid}/tasks")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_column_tasks(
    project_uid: str,
    column_uid: str,
    query: Pagination = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    tasks = await service.project_column.get_board_tasks(project_uid, column_uid, query)
    return JsonResponse(content={"tasks": tasks}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/task/{task_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.TaskUpdate], project_role_finder)
@AuthFilter.add
async def update_column_tasks(
    task_uid: str,
    form: ChangeTaskOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.task.change_task_order(user, task_uid, form.order, form.column_uid)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
