from fastapi import Depends, status
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import Pagination
from ...core.security import Auth
from ...models import User
from ...services import Service
from .DashboardProject import DashboardProjectCreateForm, DashboardProjectListResponse


@AppRouter.api.get("/dashboard/user/projects/starred")
@AuthFilter.add
async def get_starred_projects(
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    projects = await service.user.get_starred_projects(user)

    return JsonResponse(content={"projects": projects}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/dashboard/projects/{list_type}", response_model=DashboardProjectListResponse)
@AuthFilter.add
async def get_projects(
    list_type: str,
    query: Pagination = Depends(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse | DashboardProjectListResponse:
    if list_type not in ["all", "starred", "recent", "unstarred"]:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    projects = await service.project.get_dashboard_list(user, list_type, query)

    response = DashboardProjectListResponse(projects=projects)

    return response


@AppRouter.api.post("/dashboard/projects/new")
@AuthFilter.add
async def create_project(
    form: DashboardProjectCreateForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
):
    project = await service.project.create(user, form.title, form.description, form.project_type)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    return JsonResponse(content={"project_uid": project.uid}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put("/dashboard/projects/{project_uid}/star")
@AuthFilter.add
async def toggle_star_project(
    project_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project.toggle_star(user, project_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
