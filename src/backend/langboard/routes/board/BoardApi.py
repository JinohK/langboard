from typing import cast
from fastapi import Depends, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import (
    Card,
    CardRelationship,
    ChatHistory,
    Checklist,
    GlobalCardRelationshipType,
    Project,
    ProjectAssignedBot,
    ProjectColumn,
    ProjectLabel,
    ProjectRole,
)
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChatHistoryPagination, InviteProjectMemberForm, ProjectInvitationForm, project_role_finder


@AppRouter.schema()
@AppRouter.api.post(
    "/board/{project_uid}/available",
    tags=["Board"],
    description="Check if the project is available.",
    responses=(
        OpenApiSchema()
        .suc({"title": "string"})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def is_project_available(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    return JsonResponse(content={"title": project.title})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/current-roles",
    tags=["Board"],
    description="Get current roles of the user or bot in the project.",
    responses=OpenApiSchema().suc({"roles": [ALL_GRANTED, ProjectRoleAction]}).auth().role().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_current_roles(
    project_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    roles = await service.project.get_role_actions(user_or_bot, project)
    return JsonResponse(content={"roles": roles})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}",
    tags=["Board"],
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
                        }
                    },
                )
            }
        )
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user_or_bot, project_uid, is_setting=False)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    if isinstance(user_or_bot, User):
        await service.project.set_last_view(user_or_bot, project)
    return JsonResponse(content={"project": response})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/assignees",
    tags=["Board"],
    description="Get project assignees (Users and bots).",
    responses=(
        OpenApiSchema()
        .suc({"users": [User], "bots": [Bot]})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_assignees(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(user_or_bot, project)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    users = await service.project.get_assigned_users(project, as_api=True)
    bots = await service.project.get_assigned_bots(project, as_api=True)

    return JsonResponse(content={"users": users, "bots": bots})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/assigned-users",
    tags=["Board"],
    description="Get project assigned users.",
    responses=(
        OpenApiSchema()
        .suc({"users": [User]})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_assigned_users(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(user_or_bot, project)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    users = await service.project.get_assigned_users(project, as_api=True)

    return JsonResponse(content={"users": users})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/assigned-bots",
    tags=["Board"],
    description="Get project assigned bots.",
    responses=(
        OpenApiSchema()
        .suc({"bots": [Bot]})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_assigned_bots(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(user_or_bot, project)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    bots = await service.project.get_assigned_bots(project, as_api=True)

    return JsonResponse(content={"bots": bots})


@AppRouter.api.get(
    "/board/{project_uid}/chat",
    tags=["Board"],
    responses=OpenApiSchema().suc({"histories": [ChatHistory]}).auth().role().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_chat(
    project_uid: str,
    query: ChatHistoryPagination = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    histories = await service.chat_history.get_list(user_or_bot, "project", query.refer_time, query, project_uid)

    return JsonResponse(content={"histories": histories})


@AppRouter.api.delete(
    "/board/{project_uid}/chat/clear",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def clear_project_chat(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    await service.chat_history.clear(user_or_bot, "project", project_uid)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/columns",
    tags=["Board"],
    description="Get project columns.",
    responses=(
        OpenApiSchema()
        .suc({"columns": [ProjectColumn]})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_columns(
    project_uid: str,
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    columns = await service.project_column.get_all_by_project(project, as_api=True)
    return JsonResponse(content={"columns": columns})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/cards",
    tags=["Board"],
    description="Get project cards.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "cards": [
                    (
                        Card,
                        {
                            "schema": {
                                "count_comment": "integer",
                                "members": [User],
                                "relationships": [CardRelationship],
                                "labels": [ProjectLabel],
                                "checklists": [Checklist],
                            }
                        },
                    )
                ],
                "global_relationships": [GlobalCardRelationshipType],
                "columns": [ProjectColumn],
            }
        )
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_cards(
    project_uid: str,
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)
    columns = await service.project_column.get_all_by_project(project, as_api=True)
    cards = await service.card.get_board_list(project_uid)
    return JsonResponse(content={"cards": cards, "global_relationships": global_relationships, "columns": columns})


@AppRouter.api.put(
    "/board/{project_uid}/assigned-users",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().err(404, "Project not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_member(
    project_uid: str,
    form: InviteProjectMemberForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.project.update_assigned_users(user_or_bot, project, form.emails)
    if result is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.api.delete(
    "/board/{project_uid}/unassign/{assignee_uid}",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().err(404, "Project, user, or bot not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def unassign_project_assignee(
    project_uid: str,
    assignee_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.unassign_assignee(user_or_bot, project_uid, assignee_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.get(
    "/board/{project_uid}/is-assigned/{assignee_uid}",
    tags=["Board"],
    description="Check if the user or bot is assigned to the project.",
    responses=(
        OpenApiSchema()
        .suc({"result": "bool", "is_bot_disabled": "bool?"})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project, user, or bot not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def is_project_assignee(project_uid: str, assignee_uid: str, service: Service = Service.scope()) -> JsonResponse:
    target = await service.user.get_by_uid(assignee_uid)
    if not target:
        target = await service.bot.get_by_uid(assignee_uid)
        if not target:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result, assigned_data = await service.project.is_assigned(target, project_uid)
    if isinstance(target, Bot):
        return JsonResponse(
            content={"result": result, "is_bot_disabled": cast(ProjectAssignedBot, assigned_data).is_disabled}
        )
    return JsonResponse(content={"result": result})


@AppRouter.api.post(
    "/project/invite/details/{token}",
    tags=["Board"],
    responses=(
        OpenApiSchema()
        .suc({"project": {"title": "string"}})
        .auth()
        .role()
        .no_bot()
        .err(404, "Project not found.")
        .get()
    ),
)
@AuthFilter.add
async def get_invited_project_title(
    token: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    project = await service.project_invitation.get_project_by_token(user_or_bot, token)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"project": {"title": project.title}})


@AppRouter.api.post(
    "/project/invite/accept",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().err(406, "Invitation not found.").get(),
)
@AuthFilter.add
async def accept_project_invitation(
    form: ProjectInvitationForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_invitation.accept(user_or_bot, form.invitation_token)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    return JsonResponse(content={"project_uid": result})


@AppRouter.api.post(
    "/project/invite/decline",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().err(406, "Invitation not found.").get(),
)
@AuthFilter.add
async def decline_project_invitation(
    form: ProjectInvitationForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_invitation.decline(user_or_bot, form.invitation_token)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    return JsonResponse(content={})
