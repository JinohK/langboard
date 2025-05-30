from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import ProjectColumn, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChangeRootOrderForm, ColumnForm, project_role_finder


@AppRouter.schema(form=ColumnForm)
@AppRouter.api.post(
    "/board/{project_uid}/column",
    tags=["Board.Column"],
    description="Create a project column.",
    responses=(
        OpenApiSchema()
        .suc({"column": (ProjectColumn, {"schema": {"count": "integer"}})})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def create_project_column(
    project_uid: str,
    form: ColumnForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    column = await service.project_column.create(user_or_bot, project_uid, form.name)
    if not column:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={
            "column": {
                **column.api_response(),
                "count": 0,
            }
        }
    )


@AppRouter.schema(form=ColumnForm)
@AppRouter.api.put(
    "/board/{project_uid}/column/{column_uid}/name",
    tags=["Board.Column"],
    description="Change project column name.",
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or column not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_column_name(
    project_uid: str,
    column_uid: str,
    form: ColumnForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.change_name(user_or_bot, project_uid, column_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"name": form.name})


@AppRouter.api.put(
    "/board/{project_uid}/column/{column_uid}/order",
    tags=["Board.Column"],
    description="Change project column order.",
    responses=OpenApiSchema().auth().role().no_bot().err(404, "Project or column not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_column_order(
    project_uid: str,
    column_uid: str,
    form: ChangeRootOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_column.change_order(user_or_bot, project_uid, column_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/column/{column_uid}",
    tags=["Board.Column"],
    description="Delete a project column.",
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or column not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def delete_project_column(
    project_uid: str,
    column_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.delete(user_or_bot, project_uid, column_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})
