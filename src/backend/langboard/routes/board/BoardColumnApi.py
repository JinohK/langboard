from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import status
from models import Bot, ProjectColumn, ProjectRole, User
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...security import Auth, RoleFinder
from ...services import Service
from .scopes import ChangeRootOrderForm, ColumnForm


@AppRouter.schema(form=ColumnForm)
@AppRouter.api.post(
    "/board/{project_uid}/column",
    tags=["Board.Column"],
    description="Create a project column.",
    responses=(
        OpenApiSchema()
        .suc({"column": (ProjectColumn, {"schema": {"count": "integer"}})}, 201)
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def create_project_column(
    project_uid: str, form: ColumnForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    column = await service.project_column.create(user_or_bot, project_uid, form.name)
    if not column:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={
            "column": {
                **column.api_response(),
                "count": 0,
            }
        },
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.schema(form=ColumnForm)
@AppRouter.api.put(
    "/board/{project_uid}/column/{column_uid}/name",
    tags=["Board.Column"],
    description="Change project column name.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2005).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def update_project_column_name(
    project_uid: str,
    column_uid: str,
    form: ColumnForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.change_name(user_or_bot, project_uid, column_uid, form.name)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2005, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"name": form.name})


@AppRouter.api.put(
    "/board/{project_uid}/column/{column_uid}/order",
    tags=["Board.Column"],
    description="Change project column order.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2005).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def update_project_column_order(
    project_uid: str,
    column_uid: str,
    form: ChangeRootOrderForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_column.change_order(user, project_uid, column_uid, form.order)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2005, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/column/{column_uid}",
    tags=["Board.Column"],
    description="Delete a project column.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2005).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def delete_project_column(
    project_uid: str, column_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_column.delete(user_or_bot, project_uid, column_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2005, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
