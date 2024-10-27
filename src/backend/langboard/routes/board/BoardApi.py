from fastapi import Depends, status
from fastapi.responses import JSONResponse
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Chat import ChatHistoryPagination
from .RoleFinder import project_role_finder


@AppRouter.api.post("/board/{project_uid}/available")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def is_project_available() -> JSONResponse:
    return JSONResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/board/{project_uid}/chat")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_chat(
    project_uid: str,
    user: User = Auth.scope("api"),
    query: ChatHistoryPagination = Depends(),
    service: Service = Service.scope(),
) -> JSONResponse:
    histories, total = await service.chat_history.get_list(user, "project", query.current_date, query, project_uid)

    return JSONResponse(content={"histories": histories, "total": total}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/chat/clear")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def clear_project_chat(
    project_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JSONResponse:
    await service.chat_history.clear(user, "project", project_uid)

    return JSONResponse(content={}, status_code=status.HTTP_200_OK)
