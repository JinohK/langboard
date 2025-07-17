from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Depends, status
from models import ChatHistory, ChatTemplate, Project, ProjectRole, User
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...publishers import ProjectPublisher
from ...security import Auth, RoleFinder
from ...services import Service
from .forms import ChatHistoryPagination, CreateChatTemplate, UpdateChatTemplate


@AppRouter.api.get(
    "/board/{project_uid}/chat",
    tags=["Board.Chat"],
    responses=OpenApiSchema().suc({"histories": [ChatHistory]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_project_chat(
    project_uid: str,
    query: ChatHistoryPagination = Depends(),
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    histories = await service.chat.get_list(user, Project.__tablename__, project_uid, query.refer_time, query)

    return JsonResponse(content={"histories": histories})


@AppRouter.api.delete(
    "/board/{project_uid}/chat/clear",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def clear_project_chat(
    project_uid: str, user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    await service.chat.clear(user, Project.__tablename__, project_uid)

    return JsonResponse()


@AppRouter.api.get(
    "/board/{project_uid}/chat/templates",
    tags=["Board.Chat"],
    responses=OpenApiSchema().suc({"templates": [ChatTemplate]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_chat_templates(project_uid: str, service: Service = Service.scope()) -> JsonResponse:
    templates = await service.chat.get_templates(Project.__tablename__, project_uid)

    return JsonResponse(content={"templates": templates})


@AppRouter.api.post(
    "/board/{project_uid}/chat/template",
    tags=["Board.Chat"],
    responses=OpenApiSchema(201).auth().forbidden().err(404, ApiErrorCode.NF2001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def create_chat_template(
    project_uid: str, form: CreateChatTemplate, service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    template = await service.chat.create_template(project, form.name, form.template)

    await ProjectPublisher.chat_template_created(project, {"template": template.api_response()})

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/board/{project_uid}/chat/template/{template_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2018).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def update_chat_template(
    project_uid: str, template_uid: str, form: UpdateChatTemplate, service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.chat.update_template(template_uid, form.name, form.template)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse()

    template, model = result
    await ProjectPublisher.chat_template_updated(project, template, model)

    return JsonResponse()


@AppRouter.api.delete(
    "/board/{project_uid}/chat/template/{template_uid}",
    tags=["Board.Chat"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2018).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add("user")
async def delete_chat_template(project_uid: str, template_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.chat.delete_template(template_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    await ProjectPublisher.chat_template_deleted(project, template_uid)

    return JsonResponse()
