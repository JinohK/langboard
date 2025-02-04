from fastapi import status
from ...core.ai import Bot
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
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.create(user_or_bot, project_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/column/{column_uid}/name")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_column_name(
    project_uid: str,
    column_uid: str,
    form: ColumnForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.change_name(user_or_bot, project_uid, column_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"name": form.name}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/column/{column_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_column_order(
    project_uid: str,
    column_uid: str,
    form: ChangeColumnOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_column.change_order(user_or_bot, project_uid, column_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/column/{column_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def delete_column(
    project_uid: str,
    column_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.delete(user_or_bot, project_uid, column_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
