from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import status
from helpers import BotHelper, ServiceHelper
from models import ProjectRole
from models.ProjectRole import ProjectRoleAction
from publishers import ProjectBotPublisher
from ...filter import RoleFilter
from ...security import RoleFinder
from ...services import Service
from .forms import CreateBotScopeForm, DeleteBotScopeForm, ToggleBotTriggerConditionForm


@AppRouter.schema(form=CreateBotScopeForm)
@AppRouter.api.post(
    "/board/{project_uid}/bot/{bot_uid}/scope",
    tags=["Board"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF3001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def create_bot_scope_in_project(
    project_uid: str,
    bot_uid: str,
    form: CreateBotScopeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = BotHelper.get_target_model_by_param("scope", form.target_table, form.target_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)
    scope_model_class, target_scope = result

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.bot_scope.create(scope_model_class, bot, target_scope, form.conditions)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    await ProjectBotPublisher.scope_created(project, result)
    return JsonResponse()


@AppRouter.schema(form=ToggleBotTriggerConditionForm)
@AppRouter.api.put(
    "/board/{project_uid}/scope/{bot_scope_uid}/trigger-condition",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF2020).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def toggle_bot_trigger_condition(
    project_uid: str,
    bot_scope_uid: str,
    form: ToggleBotTriggerConditionForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    bot_scope = ServiceHelper.get_by_param(scope_model_class, bot_scope_uid)
    if not bot_scope:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    result = await service.bot_scope.toggle_trigger_condition(scope_model_class, bot_scope, form.condition)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)

    await ProjectBotPublisher.scope_conditions_updated(project, bot_scope)
    return JsonResponse()


@AppRouter.schema(form=DeleteBotScopeForm)
@AppRouter.api.delete(
    "/board/{project_uid}/scope/{bot_scope_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF2020).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def delete_bot_scope(
    project_uid: str,
    bot_scope_uid: str,
    form: DeleteBotScopeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    scope_model_class = BotHelper.get_bot_model_class("scope", form.target_table)
    if not scope_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    bot_scope = ServiceHelper.get_by_param(scope_model_class, bot_scope_uid)
    if not bot_scope:
        return JsonResponse(content=ApiErrorCode.NF2020, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    await service.bot_scope.delete(scope_model_class, bot_scope)
    await ProjectBotPublisher.scope_deleted(project, bot_scope)
    return JsonResponse()
