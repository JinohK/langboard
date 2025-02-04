from fastapi import Depends, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...services import Service
from .DashboardForm import DashboardPagination, DashboardProjectCreateForm


@AppRouter.api.get("/dashboard/user/projects/starred")
@AuthFilter.add
async def get_starred_projects(
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    projects = await service.user.get_starred_projects(user_or_bot)

    return JsonResponse(content={"projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/dashboard/projects")
@AuthFilter.add
async def get_projects(
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    projects = await service.project.get_dashboard_list(user_or_bot)

    return JsonResponse(content={"projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/dashboard/projects/new")
@AuthFilter.add
async def create_project(
    form: DashboardProjectCreateForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
):
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    project = await service.project.create(user_or_bot, form.title, form.description, form.project_type)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    return JsonResponse(content={"project_uid": project.get_uid()}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put("/dashboard/projects/{project_uid}/star")
@AuthFilter.add
async def toggle_star_project(
    project_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project.toggle_star(user_or_bot, project_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/dashboard/cards")
@AuthFilter.add
async def get_card_list(
    pagination: DashboardPagination = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    cards, projects = await service.card.get_dashboard_list(user_or_bot, pagination, pagination.refer_time)

    return JsonResponse(content={"cards": cards, "projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/dashboard/tracking")
@AuthFilter.add
async def track_checkitems(
    pagination: DashboardPagination = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    checkitems, cards, projects = await service.checkitem.track_list(user_or_bot, pagination, pagination.refer_time)

    return JsonResponse(
        content={"checkitems": checkitems, "cards": cards, "projects": projects}, status_code=status.HTTP_200_OK
    )
