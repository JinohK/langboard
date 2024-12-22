from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChangeColumnOrderForm, ColumnForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/column")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def create_column(
    project_uid: str,
    form: ColumnForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.create(user, project_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/column/{column_uid}/name")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_column_name(
    project_uid: str,
    column_uid: str,
    form: ColumnForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.change_name(user, project_uid, column_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={"name": form.name}, status_code=status.HTTP_200_OK)


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
    result = await service.project_column.change_order(user, project_uid, column_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
