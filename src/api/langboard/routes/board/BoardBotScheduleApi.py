from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from core.types import SafeDateTime
from fastapi import Depends, status
from helpers import BotHelper, ServiceHelper
from models import (
    Bot,
    BotSchedule,
    Card,
    CardBotSchedule,
    Project,
    ProjectColumn,
    ProjectColumnBotSchedule,
    ProjectRole,
)
from models.BotSchedule import BotScheduleRunningType
from models.ProjectRole import ProjectRoleAction
from publishers import ProjectBotPublisher
from ...ai import BotScheduleHelper
from ...filter import RoleFilter
from ...security import RoleFinder
from ...services import Service
from .forms import (
    BotSchedulePagination,
    CreateBotCronTimeForm,
    DeleteBotCronTimeForm,
    UpdateBotCronTimeForm,
)


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/board/{project_uid}/bot/{bot_uid}/card/{card_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules for a specific card.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "schedules": [(BotSchedule, {"schema": CardBotSchedule.api_schema()})],
                "target": Card,
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2014)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_card(
    bot_uid: str,
    card_uid: str,
    pagination: BotSchedulePagination = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_uid(card_uid)
    if not card:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    schedules = await BotScheduleHelper.get_all_by_scope(
        CardBotSchedule,
        bot,
        card,
        as_api=True,
        pagination=pagination,
        refer_time=pagination.refer_time,
        status=pagination.status,
    )

    return JsonResponse(content={"schedules": schedules, "target": card.api_response()})


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/board/{project_uid}/bot/{bot_uid}/column/{column_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules for a specific column.",
    responses=(
        OpenApiSchema()
        .suc(
            {
                "schedules": [(BotSchedule, {"schema": ProjectColumnBotSchedule.api_schema()})],
                "target": ProjectColumn,
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF2013)
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def get_bot_schedules_by_column(
    bot_uid: str,
    column_uid: str,
    pagination: BotSchedulePagination = Depends(),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    column = await service.project_column.get_by_uid(column_uid)
    if not column:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    schedules = await BotScheduleHelper.get_all_by_scope(
        ProjectColumnBotSchedule,
        bot,
        column,
        as_api=True,
        pagination=pagination,
        refer_time=pagination.refer_time,
        status=pagination.status,
    )

    return JsonResponse(content={"schedules": schedules, "target": column.api_response()})


@AppRouter.schema(form=CreateBotCronTimeForm)
@AppRouter.api.post(
    "/board/{project_uid}/bot/{bot_uid}/schedule",
    tags=["Board.Settings.BotCron"],
    description="Schedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2001).err(404, ApiErrorCode.NF3001).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def schedule_bot_crons(
    project_uid: str,
    bot_uid: str,
    form: CreateBotCronTimeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    form.interval_str = BotScheduleHelper.convert_valid_interval_str(form.interval_str)
    if not form.interval_str:
        return JsonResponse(content=ApiErrorCode.VA3001, status_code=status.HTTP_400_BAD_REQUEST)

    if form.running_type == BotScheduleRunningType.Duration and not form.start_at:
        form.start_at = SafeDateTime.now()

    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    result = BotHelper.get_target_model_by_param("schedule", form.target_table, form.target_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3004, status_code=status.HTTP_400_BAD_REQUEST)
    target_model_class, target_model = result

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content=ApiErrorCode.NF2001, status_code=status.HTTP_404_NOT_FOUND)

    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    bot_schedule = await BotScheduleHelper.schedule(
        target_model_class,
        bot,
        form.interval_str,
        target_model,
        form.running_type,
        form.start_at,
        form.end_at,
        form.timezone,
    )
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.VA3005, status_code=status.HTTP_400_BAD_REQUEST)

    await ProjectBotPublisher.scheduled(project, bot_schedule)

    return JsonResponse()


@AppRouter.schema(form=UpdateBotCronTimeForm)
@AppRouter.api.put(
    "/board/{project_uid}/bot/{bot_uid}/reschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Reschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2015).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def reschedule_bot_crons(
    project_uid: str,
    bot_uid: str,
    schedule_uid: str,
    form: UpdateBotCronTimeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    if not BotScheduleHelper.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content=ApiErrorCode.VA3002, status_code=status.HTTP_400_BAD_REQUEST)

    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    target_model_class = BotHelper.get_bot_model_class("schedule", form.target_table)
    if not target_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    bot_schedule = ServiceHelper.get_by_param(target_model_class, schedule_uid)
    if not bot_schedule:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)

    result = await BotScheduleHelper.reschedule(
        target_model_class,
        bot_schedule,
        form.interval_str,
        form.running_type,
        form.start_at,
        form.end_at,
        form.timezone,
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.VA3005, status_code=status.HTTP_400_BAD_REQUEST)
    _, schedule_model, model = result

    await ProjectBotPublisher.rescheduled(project, schedule_model, model)

    return JsonResponse()


@AppRouter.schema(form=DeleteBotCronTimeForm)
@AppRouter.api.delete(
    "/board/{project_uid}/bot/{bot_uid}/unschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Unschedule a bot cron schedule.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2015).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], RoleFinder.project)
@AuthFilter.add()
async def unschedule_bot_crons(
    project_uid: str,
    bot_uid: str,
    schedule_uid: str,
    form: DeleteBotCronTimeForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    target_model_class = BotHelper.get_bot_model_class("schedule", form.target_table)
    if not target_model_class:
        return JsonResponse(content=ApiErrorCode.VA3003, status_code=status.HTTP_400_BAD_REQUEST)

    result = await BotScheduleHelper.unschedule(target_model_class, schedule_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2015, status_code=status.HTTP_404_NOT_FOUND)
    _, schedule_model = result

    await ProjectBotPublisher.unscheduled(project, schedule_model)

    return JsonResponse()


async def _get_project_with_bot(service: Service, project_uid: str, bot_uid: str) -> tuple[Project, Bot] | None:
    project = await service.project.get_by_uid(project_uid)
    if not project:
        return None

    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return None

    return project, bot
