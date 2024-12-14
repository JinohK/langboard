from fastapi import Depends, status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema.Pagination import Pagination
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from ..board.RoleFinder import project_role_finder


@AppRouter.api.get("/activity/user")
@AuthFilter.add
async def get_user_activities(
    query: Pagination = Depends(), user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    activities = {}
    return JsonResponse(content={"activities": activities}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/activity/project/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def get_card_activities(
    card_uid: str, query: Pagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    card = await service.card.get_by_uid(card_uid)
    if card is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    activities = {}
    return JsonResponse(content={"activities": activities}, status_code=status.HTTP_200_OK)
