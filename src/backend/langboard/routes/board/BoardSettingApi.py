from fastapi import status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.BaseRoleModel import ALL_GRANTED
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import project_role_finder


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
