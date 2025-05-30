from fastapi import Depends, File, UploadFile, status
from ...core.ai import Bot, BotRunner, InternalBotType
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import ChatHistory, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ChatHistoryPagination, project_role_finder


@AppRouter.api.get(
    "/board/{project_uid}/chat",
    tags=["Board"],
    responses=OpenApiSchema().suc({"histories": [ChatHistory]}).auth().role().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_chat(
    project_uid: str,
    query: ChatHistoryPagination = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    histories = await service.chat_history.get_list(user_or_bot, "project", query.refer_time, query, project_uid)

    return JsonResponse(content={"histories": histories})


@AppRouter.api.delete(
    "/board/{project_uid}/chat/clear",
    tags=["Board"],
    responses=OpenApiSchema().auth().role().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def clear_project_chat(
    project_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    await service.chat_history.clear(user_or_bot, "project", project_uid)

    return JsonResponse(content={})


@AppRouter.api.post("/board/{project_uid}/chat/upload")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def upload_board_chat_file(project_uid: str, attachment: UploadFile = File(), service: Service = Service.scope()):
    if not await service.project.get_by_uid(project_uid):
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    file_path = await BotRunner.upload_file(InternalBotType.ProjectChat, attachment)
    if not file_path:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    return JsonResponse(content={"file_path": file_path}, status_code=status.HTTP_201_CREATED)
