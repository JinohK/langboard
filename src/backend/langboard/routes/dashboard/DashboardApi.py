from fastapi import Depends, status
from fastapi.responses import JSONResponse
from ...core.filter import AuthFilter
from ...core.routing import AppRouter
from ...core.schema import Pagination
from ...core.security import Auth
from ...models import User
from ...services import Service
from .DashboardProject import DashboardProjectListResponse


@AppRouter.api.get("/dashboard/projects/{list_type}", response_model=DashboardProjectListResponse)
@AuthFilter.add
async def get_projects(
    list_type: str,
    query: Pagination = Depends(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
):
    if list_type not in ["starred", "recent", "unstarred"]:
        return JSONResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    projects, total = await service.project.dashboard_list(user, list_type, query)

    response = DashboardProjectListResponse(projects=projects, total=total)

    return response


@AppRouter.api.put("/dashboard/projects/{project_uid}/star")
@AuthFilter.add
async def toggle_star_project(
    project_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JSONResponse:
    result = await service.project.toggle_star(user, project_uid)
    if not result:
        return JSONResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JSONResponse(content={}, status_code=status.HTTP_200_OK)
