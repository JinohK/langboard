from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...core.utils.Converter import convert_python_data
from ...models import Card, ChatTemplate, Project, ProjectColumn, ProjectLabel, ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    AssignBotsForm,
    ChangeRootOrderForm,
    CreateProjectLabelForm,
    UpdateProjectDetailsForm,
    UpdateProjectLabelDetailsForm,
    UpdateRolesForm,
    project_role_finder,
)


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/details",
    tags=["Board.Settings"],
    description="Get project details.",
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
                            "chat_templates": [ChatTemplate],
                        }
                    },
                ),
                "bots": [Bot],
                "columns": [ProjectColumn],
                "cards": [(Card, {"schema": {"column_name": "string"}})],
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2001)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add()
async def get_project_details(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user_or_bot, project_uid, is_setting=True)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    response["description"] = project.description
    response["ai_description"] = project.ai_description

    bots = await service.bot.get_list(as_api=True)
    columns = await service.project_column.get_all_by_project(project, as_api=True)
    cards = await service.card.get_all_by_project(project, as_api=True)
    templates = await service.chat.get_templates(Project.__tablename__, project_uid)

    return JsonResponse(
        content={"project": response, "bots": bots, "columns": columns, "cards": cards, "chat_templates": templates}
    )


@AppRouter.schema(form=UpdateProjectDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/details",
    tags=["Board.Settings"],
    description="Change project details.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add()
async def change_project_details(
    project_uid: str,
    form: UpdateProjectDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project.update(user_or_bot, project_uid, form.model_dump())
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=AssignBotsForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/assigned-bots",
    tags=["Board.Settings"],
    description="Update assigned bots for a project.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def update_project_assigned_bots(
    project_uid: str, form: AssignBotsForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update_assigned_bots(user, project_uid, form.assigned_bots)
    if result is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/roles/bot/{bot_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2007).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def update_project_bot_roles(
    project_uid: str, bot_uid: str, form: UpdateRolesForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update_bot_roles(project_uid, bot_uid, form.roles)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/bot/{bot_uid}/toggle-activation",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2007).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def toggle_project_bot_activation(
    project_uid: str, bot_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.toggle_bot_activation(user, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/settings/roles/user/{user_uid}",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2008).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def update_project_user_roles(
    project_uid: str, user_uid: str, form: UpdateRolesForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update_user_roles(project_uid, user_uid, form.roles)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2008, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=CreateProjectLabelForm)
@AppRouter.api.post(
    "/board/{project_uid}/settings/label",
    tags=["Board.Settings"],
    description="Create a project label.",
    responses=(
        OpenApiSchema().suc({"label": ProjectLabel}, 201).auth().forbidden().err(404, ApiErrorCode.NF2001).get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add()
async def create_project_label(
    project_uid: str,
    form: CreateProjectLabelForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.create(user_or_bot, project_uid, form.name, form.color, form.description)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)
    _, api_label = result

    return JsonResponse(content={"label": api_label}, status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=UpdateProjectLabelDetailsForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/details",
    tags=["Board.Settings"],
    description="Change project label details.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "name?": "string",
                "color?": "string",
                "description?": "string",
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2009)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add()
async def change_project_label_details(
    project_uid: str,
    label_uid: str,
    form: UpdateProjectLabelDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_label.update(user_or_bot, project_uid, label_uid, form.model_dump())
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2009, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in UpdateProjectLabelDetailsForm.model_fields:
            if ["name", "color", "description"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = convert_python_data(value)
        return JsonResponse(content=response)

    return JsonResponse(content=result)


@AppRouter.schema(form=ChangeRootOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/label/{label_uid}/order",
    tags=["Board.Settings"],
    description="Change project label order.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2009).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def change_project_label_order(
    project_uid: str, label_uid: str, form: ChangeRootOrderForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.change_order(project_uid, label_uid, form.order)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2009, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/settings/label/{label_uid}",
    tags=["Board.Settings"],
    description="Delete a project label.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2009).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add()
async def delete_label(
    project_uid: str, label_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project_label.delete(user_or_bot, project_uid, label_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2009, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/settings/delete",
    tags=["Board.Settings"],
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2002).err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add("user")
async def delete_project(
    project_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    if project.owner_id != user.id and not user.is_admin:
        return JsonResponse(content=ApiErrorCode.PE2002, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.delete(user, project_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
