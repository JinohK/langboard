from fastapi import Depends, status
from ...core.filter import AuthFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...models import Card, Checkitem, Project, ProjectColumn, User
from ...security import Auth
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
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("user")
async def get_starred_projects(user: User = Auth.scope("api_user"), service: Service = Service.scope()) -> JsonResponse:
    projects = await service.project.get_starred_projects(user)

    return JsonResponse(content={"projects": projects})


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
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("user")
async def get_projects(user: User = Auth.scope("api_user"), service: Service = Service.scope()) -> JsonResponse:
    projects = await service.project.get_dashboard_list(user)

    return JsonResponse(content={"projects": projects})


@AppRouter.api.post(
    "/dashboard/projects/new",
    tags=["Dashboard"],
    responses=OpenApiSchema().suc({"project_uid": "string"}, 201).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def create_project(
    form: DashboardProjectCreateForm, user: User = Auth.scope("api_user"), service: Service = Service.scope()
):
    project = await service.project.create(user, form.title, form.description, form.project_type)
    return JsonResponse(content={"project_uid": project.get_uid()}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/dashboard/projects/{project_uid}/star",
    tags=["Dashboard"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@AuthFilter.add("user")
async def toggle_star_project(
    project_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.project.toggle_star(user, project_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


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
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("user")
async def get_card_list(
    pagination: DashboardPagination = Depends(), user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    cards, projects = await service.card.get_dashboard_list(user, pagination, pagination.refer_time)

    return JsonResponse(content={"cards": cards, "projects": projects})


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
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("user")
async def track_checkitems(
    pagination: DashboardPagination = Depends(), user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    checkitems, cards, projects = await service.checkitem.get_track_list(user, pagination, pagination.refer_time)

    return JsonResponse(content={"checkitems": checkitems, "cards": cards, "projects": projects})
