from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import Project, ProjectLabel, ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    AssignBotsForm,
    ChangeColumnOrderForm,
    CreateProjectLabelForm,
    UpdateMemberRolesForm,
    UpdateProjectDetailsForm,
    UpdateProjectLabelDetailsForm,
    project_role_finder,
)


@AppRouter.api.get(
    "/board/{project_uid}/details",
    tags=["Board.Settings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "project": (
                    Project,
                    {
                        "schema": {
                            "owner": User,
                            "members": [User],
                            "bots": [Bot],
                            "current_auth_role_actions": [ALL_GRANTED, ProjectRoleAction],
                            "labels": [ProjectLabel],
                            "invited_members": [User],
                            "bot_roles": {"<bot uid>": [ALL_GRANTED, ProjectRoleAction]},
                            "member_roles": {"<user uid>": [ALL_GRANTED, ProjectRoleAction]},
                        }
                    },
                ),
                "bots": [Bot],
            }
        )
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def get_project_details(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user_or_bot, project_uid, with_roles=True)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    response["description"] = project.description
    response["ai_description"] = project.ai_description
    bots = await service.bot.get_list(as_api=True)

    return JsonResponse(content={"project": response, "bots": bots}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/details",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_project_details(
    project_uid: str,
    form: UpdateProjectDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project.update(user_or_bot, project_uid, form.model_dump())
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/assigned-bots",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_assigned_bots(
    project_uid: str,
    form: AssignBotsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.update_assigned_bots(user_or_bot, project_uid, form.assigned_bots)
    if result is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/roles/bot/{bot_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_bot_roles(
    project_uid: str,
    bot_uid: str,
    form: UpdateMemberRolesForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.update_bot_roles(project_uid, bot_uid, form.roles)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/roles/user/{user_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_user_roles(
    project_uid: str,
    user_uid: str,
    form: UpdateMemberRolesForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.update_user_roles(project_uid, user_uid, form.roles)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/board/{project_uid}/settings/label",
    tags=["Board.Settings"],
    responses=(
        OpenApiSchema()
        .suc({"label": ProjectLabel})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def create_label_details(
    project_uid: str,
    form: CreateProjectLabelForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.create(user_or_bot, project_uid, form.name, form.color, form.description)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_label = result

    return JsonResponse(content={"label": api_label}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/details",
    tags=["Board.Settings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "name?": "string",
                "color?": "string",
                "description?": "string",
            }
        )
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project or label not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_label_details(
    project_uid: str,
    label_uid: str,
    form: UpdateProjectLabelDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.update(user_or_bot, project_uid, label_uid, form.model_dump())
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in form.model_fields:
            if ["name", "color", "description"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = service.card._convert_to_python(value)
        return JsonResponse(content=response, status_code=status.HTTP_200_OK)

    return JsonResponse(content=result, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/order",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().role().no_bot().err(404, "Project or label not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_label_order(
    project_uid: str,
    label_uid: str,
    form: ChangeColumnOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_label.change_order(user_or_bot, project_uid, label_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/board/{project_uid}/settings/label/{label_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or label not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def delete_label(
    project_uid: str, label_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.delete(user_or_bot, project_uid, label_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/board/{project_uid}/settings/delete",
    tags=["Board.Settings"],
    responses=(
        OpenApiSchema()
        .auth()
        .role()
        .err(403, "Bot cannot access this endpoint or no permission to delete this project.")
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def delete_project(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if project.owner_id != user_or_bot.id and not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.delete(user_or_bot, project_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
