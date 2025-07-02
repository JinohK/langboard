from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from core.types import SafeDateTime
from fastapi import Depends, status
from models import Bot, BotSchedule, Card, Project, ProjectColumn, ProjectRole
from models.BotSchedule import BotScheduleRunningType
from models.ProjectRole import ProjectRoleAction
from ...ai import BotScheduleHelper
from ...core.service import ServiceHelper
from ...filter import RoleFilter
from ...publishers import ProjectBotPublisher
from ...security import RoleFinder
from ...services import Service
from .scopes import BotSchedulePagination, BotScheduleSearchForm, CreateBotCronTimeForm, UpdateBotCronTimeForm


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/board/{project_uid}/settings/bot/{bot_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [(BotSchedule, {"schema": {"target": "object"}})]})
        .auth()
        .forbidden()
        .err(403, ApiErrorCode.PE2001)
        .err(404, ApiErrorCode.NF2007)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules(
    project_uid: str, bot_uid: str, pagination: BotSchedulePagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(bot, project)
    if not result:
        return JsonResponse(content=ApiErrorCode.PE2001, status_code=status.HTTP_403_FORBIDDEN)

    schedules = await BotScheduleHelper.get_all_by_filterable(
        bot, project, as_api=True, pagination=pagination, refer_time=pagination.refer_time, status=pagination.status
    )

    return JsonResponse(content={"schedules": schedules})


@AppRouter.schema(query=BotScheduleSearchForm)
@AppRouter.api.get(
    "/board/{project_uid}/settings/bot/{bot_uid}/card/{card_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules for a specific card.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [BotSchedule], "card": Card})
        .auth()
        .forbidden()
        .err(403, ApiErrorCode.PE2001)
        .err(404, ApiErrorCode.NF2016)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_card(
    project_uid: str,
    bot_uid: str,
    card_uid: str,
    search: BotScheduleSearchForm = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2016, status_code=status.HTTP_404_NOT_FOUND)

    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2016, status_code=status.HTTP_404_NOT_FOUND)
    project, card = params

    result, _ = await service.project.is_assigned(bot, project)
    if not result:
        return JsonResponse(content=ApiErrorCode.PE2001, status_code=status.HTTP_403_FORBIDDEN)

    schedules = await BotScheduleHelper.get_all_by_scope(bot, card, project, as_api=True, status=search.status)

    return JsonResponse(content={"schedules": schedules, "card": card.api_response()})


@AppRouter.schema(query=BotScheduleSearchForm)
@AppRouter.api.get(
    "/board/{project_uid}/settings/bot/{bot_uid}/column/{column_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules for a specific column.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [BotSchedule], "column": Card})
        .auth()
        .forbidden()
        .err(403, ApiErrorCode.PE2001)
        .err(404, ApiErrorCode.NF2015)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_column(
    project_uid: str,
    bot_uid: str,
    column_uid: str,
    search: BotScheduleSearchForm = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)

    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectColumn, column_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)
    project, column = params

    result, _ = await service.project.is_assigned(bot, project)
    if not result:
        return JsonResponse(content=ApiErrorCode.PE2001, status_code=status.HTTP_403_FORBIDDEN)

    schedules = await BotScheduleHelper.get_all_by_scope(bot, column, project, as_api=True, status=search.status)

    return JsonResponse(content={"schedules": schedules, "project_column": column.api_response()})


@AppRouter.schema(form=CreateBotCronTimeForm)
@AppRouter.api.post(
    "/board/{project_uid}/settings/bot/{bot_uid}/schedule",
    tags=["Board.Settings.BotCron"],
    description="Schedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2007).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def schedule_bot_crons(
    project_uid: str, bot_uid: str, form: CreateBotCronTimeForm, service: Service = Service.scope()
) -> JsonResponse:
    if not BotScheduleHelper.is_valid_interval_str(form.interval_str):
        return JsonResponse(content=ApiErrorCode.VA3001, status_code=status.HTTP_400_BAD_REQUEST)

    if form.running_type == BotScheduleRunningType.Duration and not form.start_at:
        form.start_at = SafeDateTime.now()

    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    target_model = await _get_target_model(form.target_table, form.target_uid, service)
    if not target_model:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2007, status_code=status.HTTP_404_NOT_FOUND)
    project, bot = result

    bot_schedule = await BotScheduleHelper.schedule(
        bot, form.interval_str, target_model, project, form.running_type, form.start_at, form.end_at, form.timezone
    )
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)

    await ProjectBotPublisher.scheduled(project, bot, bot_schedule)

    return JsonResponse()


@AppRouter.schema(form=UpdateBotCronTimeForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/bot/{bot_uid}/reschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Reschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2017).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def reschedule_bot_crons(
    project_uid: str, bot_uid: str, schedule_uid: str, form: UpdateBotCronTimeForm, service: Service = Service.scope()
) -> JsonResponse:
    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    bot_schedule = ServiceHelper.get_by_param(BotSchedule, schedule_uid)
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)

    if form.target_table and form.target_uid:
        target_model = await _get_target_model(form.target_table, form.target_uid, service)
        if not target_model:
            return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)
        filterable_model = project
    else:
        target_model = None
        filterable_model = None

    result = await BotScheduleHelper.reschedule(
        bot_schedule,
        form.interval_str,
        target_model,
        filterable_model,
        form.running_type,
        form.start_at,
        form.end_at,
        form.timezone,
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)
    bot_schedule, model = result

    await ProjectBotPublisher.rescheduled(project, bot_schedule, model)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/settings/bot/{bot_uid}/unschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Unschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2017).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def unschedule_bot_crons(
    project_uid: str, bot_uid: str, schedule_uid: str, service: Service = Service.scope()
) -> JsonResponse:
    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    bot_schedule = await BotScheduleHelper.unschedule(schedule_uid)
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.NF2017, status_code=status.HTTP_404_NOT_FOUND)

    await ProjectBotPublisher.deleted(project, bot_schedule)

    return JsonResponse()


async def _get_project_with_bot(service: Service, project_uid: str, bot_uid: str) -> tuple[Project, Bot] | None:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return None

    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return None

    result, _ = await service.project.is_assigned(bot, project)
    if not result:
        return None

    return project, bot


async def _get_target_model(target_table: str, target_uid: str, service: Service) -> ProjectColumn | Card | None:
    AVAILABLE_TARGET_TABLES = [ProjectColumn.__tablename__, Card.__tablename__]
    if target_table not in AVAILABLE_TARGET_TABLES:
        return None

    if target_table == "project_column":
        return await service.project_column.get_by_uid(target_uid)
    elif target_table == "card":
        return await service.card.get_by_uid(target_uid)
    else:
        return None
