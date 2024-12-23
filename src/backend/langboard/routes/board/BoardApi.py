from fastapi import Depends, status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import AcceptProjectInvitationForm, ChatHistoryPagination, InviteProjectMemberForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def is_project_available(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.get_details(user, project_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, response = result
    await service.project.set_last_view(user, project)
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
    columns = await service.project_column.get_list(project)
    cards = await service.card.get_board_list(project_uid)
    return JsonResponse(content={"cards": cards, "columns": columns}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/assigned-users")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def update_project_member(
    project_uid: str,
    form: InviteProjectMemberForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.project.update_assign_users(
        user, project, form.lang, form.url, form.token_query_name, form.emails
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish_with_socket_model(result)

    # TODO: Email, Remove urls after implementing email sending
    return JsonResponse(content={"urls": result.data}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/project/invite/accept")
@AuthFilter.add
async def accept_project_invitation(
    form: AcceptProjectInvitationForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_invitation.accept(user, form.invitation_token)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
