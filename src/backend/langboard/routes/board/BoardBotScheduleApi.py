from fastapi import Depends, status
from ...core.ai import Bot, BotSchedule
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.service import BotScheduleService
from ...models import Card, Project, ProjectColumn, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...publishers import ProjectBotPublisher
from ...services import Service
from .scopes import BotCronTimeForm, BotSchedulePagination, project_role_finder


@AppRouter.schema(query=BotSchedulePagination)
@AppRouter.api.get(
    "/board/{project_uid}/settings/bot/{bot_uid}/schedules",
    tags=["Board.Settings.BotCron"],
    description="Get all bot cron schedules.",
    responses=(
        OpenApiSchema()
        .suc({"schedules": [(BotSchedule, {"schema": {"target": "object"}})]})
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(404, "Project or bot not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def get_bot_schedules(
    project_uid: str, bot_uid: str, pagination: BotSchedulePagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    project = await service.project.get_by_uid(project_uid)
    if not project:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    result, _ = await service.project.is_assigned(bot, project)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    schedules = await BotScheduleService.get_all_by_filterable(
        bot, project, as_api=True, pagination=pagination, refer_time=pagination.refer_time
    )

    return JsonResponse(content={"schedules": schedules})


@AppRouter.schema(form=BotCronTimeForm)
@AppRouter.api.post(
    "/board/{project_uid}/settings/bot/{bot_uid}/schedule",
    tags=["Board.Settings.BotCron"],
    description="Schedule a bot cron schedule.",
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Bot or target table not found").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def schedule_bot_crons(
    project_uid: str, bot_uid: str, form: BotCronTimeForm, service: Service = Service.scope()
) -> JsonResponse:
    if (
        not form.interval_str
        or not BotScheduleService.is_valid_interval_str(form.interval_str)
        or not form.target_table
        or not form.target_uid
    ):
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    if not BotScheduleService.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    target_model = await _get_target_model(form.target_table, form.target_uid, service)
    if not target_model:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, bot = result

    if not target_model:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    bot_schedule = await BotScheduleService.schedule(
        bot, form.interval_str, target_model, project, form.running_type, form.start_at, form.end_at
    )
    if not bot_schedule:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    ProjectBotPublisher.scheduled(project, bot, bot_schedule)

    return JsonResponse(content={})


@AppRouter.schema(form=BotCronTimeForm)
@AppRouter.api.put(
    "/board/{project_uid}/settings/bot/{bot_uid}/reschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Reschedule a bot cron schedule.",
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, bot, or schedule not found").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def reschedule_bot_crons(
    project_uid: str, bot_uid: str, schedule_uid: str, form: BotCronTimeForm, service: Service = Service.scope()
) -> JsonResponse:
    if not BotScheduleService.get_default_status_with_dates(
        running_type=form.running_type, start_at=form.start_at, end_at=form.end_at
    ):
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    if form.target_table and form.target_uid:
        target_model = await _get_target_model(form.target_table, form.target_uid, service)
        if not target_model:
            return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)
        filterable_model = project
    else:
        target_model = None
        filterable_model = None

    result = await BotScheduleService.reschedule(
        schedule_uid, form.interval_str, target_model, filterable_model, form.running_type, form.start_at, form.end_at
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)
    bot_schedule, model = result

    ProjectBotPublisher.rescheduled(project, bot_schedule, model)

    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/settings/bot/{bot_uid}/unschedule/{schedule_uid}",
    tags=["Board.Settings.BotCron"],
    description="Unschedule a bot cron schedule.",
    responses=OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or bot not found").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Update], project_role_finder)
@AuthFilter.add
async def unschedule_bot_crons(
    project_uid: str, bot_uid: str, schedule_uid: str, service: Service = Service.scope()
) -> JsonResponse:
    result = await _get_project_with_bot(service, project_uid, bot_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    project, _ = result

    bot_schedule = await BotScheduleService.unschedule(schedule_uid)
    if not bot_schedule:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    ProjectBotPublisher.deleted(project, bot_schedule)

    return JsonResponse(content={})


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
