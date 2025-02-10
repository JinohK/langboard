from fastapi import Depends, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import Card, Checkitem, Project, ProjectColumn
from ...services import Service
from .DashboardForm import DashboardPagination, DashboardProjectCreateForm


@AppRouter.api.get(
    "/dashboard/user/projects/starred",
    tags=["Dashboard"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "projects": [Project],
            }
        )
        .auth()
        .no_bot()
        .get()
    ),
)
@AuthFilter.add
async def get_starred_projects(
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    projects = await service.project.get_starred_projects(user_or_bot)

    return JsonResponse(content={"projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.get(
    "/dashboard/projects",
    tags=["Dashboard"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "projects": [
                    (
                        Project,
                        {
                            "schema": {
                                "starred": "bool",
                                "last_viewed_at": "string",
                                "columns": [(ProjectColumn, {"schema": {"count": "integer"}})],
                            }
                        },
                    ),
                ],
            }
        )
        .auth()
        .no_bot()
        .get()
    ),
)
@AuthFilter.add
async def get_projects(
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    projects = await service.project.get_dashboard_list(user_or_bot)

    return JsonResponse(content={"projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/dashboard/projects/new",
    tags=["Dashboard"],
    responses=OpenApiSchema().suc({"project_uid": "string"}).auth().no_bot().get(),
)
@AuthFilter.add
async def create_project(
    form: DashboardProjectCreateForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
):
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if not form.title:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    project = await service.project.create(user_or_bot, form.title, form.description, form.project_type)
    return JsonResponse(content={"project_uid": project.get_uid()}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/dashboard/projects/{project_uid}/star",
    tags=["Dashboard"],
    responses=OpenApiSchema().auth().no_bot().err(404, "Project not found.").get(),
)
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


@AppRouter.api.get(
    "/dashboard/cards",
    tags=["Dashboard"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "cards": [(Card, {"schema": {"column_name": "string"}})],
                "projects": [Project],
            }
        )
        .auth()
        .no_bot()
        .get()
    ),
)
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


@AppRouter.api.get(
    "/dashboard/tracking",
    tags=["Dashboard"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "checkitems": [
                    (
                        Checkitem,
                        {
                            "schema": {
                                "card_uid": "string",
                                "initial_timer_started_at": "string",
                                "timer_started_at": "string",
                            }
                        },
                    ),
                ],
                "cards": [Card],
                "projects": [Project],
            }
        )
        .auth()
        .no_bot()
        .get()
    ),
)
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
