from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import UpdateProjectDetailsForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/settings/available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def can_use_settings(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    current_user_role_actions = await service.project.get_user_role_actions(user, project)
    if ProjectRoleAction.Update in current_user_role_actions or ALL_GRANTED in current_user_role_actions:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)
    else:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)


@AppRouter.api.get("/board/{project_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def get_project_details(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    await service.project.set_last_view(user, project)
    response = project.api_response()
    response["description"] = project.description
    response["ai_description"] = project.ai_description
    response["members"] = await service.project.get_assigned_users(project, as_api=True)
    response["current_user_role_actions"] = await service.project.get_user_role_actions(user, project)
    response["invited_users"] = []
    invited_users = await service.project_invitation.get_invited_users(project)
    for invitation, invited_user in invited_users:
        if invited_user:
            response["invited_users"].append(invited_user.api_response())
        else:
            response["invited_users"].append(
                service.project_invitation.convert_none_user_api_response(invitation.email)
            )
    return JsonResponse(content={"project": response}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/settings/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def change_project_details(
    project_uid: str, form: UpdateProjectDetailsForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.update(user, project_uid, form.model_dump())
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    await AppRouter.publish_with_socket_model(result)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
