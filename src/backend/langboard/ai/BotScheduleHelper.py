from os import environ
from subprocess import run as subprocess_run
from typing import Any, Literal, overload
from crontab import CronItem, CronTab, OrderedVariableList
from psutil import process_iter
from ..Constants import CRON_TAB_FILE
from ..core.db import BaseSqlModel, DbSession, SqlBuilder
from ..core.schema import Pagination
from ..core.service import ServiceHelper
from ..core.types import SafeDateTime
from ..core.utils.decorators import staticclass
from ..models import Bot, BotSchedule
from ..models.BotSchedule import BotScheduleRunningType, BotScheduleStatus


_TBotScheduleParam = BotSchedule | int | str | None


@staticclass
class BotScheduleHelper:
    @staticmethod
    @overload
    async def get_all_by_filterable(
        bot: Bot,
        filterable_model: BaseSqlModel,
        as_api: Literal[False],
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
        status: BotScheduleStatus | None = None,
    ) -> list[BotSchedule]: ...
    @staticmethod
    @overload
    async def get_all_by_filterable(
        bot: Bot,
        filterable_model: BaseSqlModel,
        as_api: Literal[True],
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
        status: BotScheduleStatus | None = None,
    ) -> list[dict[str, Any]]: ...
    @staticmethod
    async def get_all_by_filterable(
        bot: Bot,
        filterable_model: BaseSqlModel,
        as_api: bool,
        pagination: Pagination | None = None,
        refer_time: SafeDateTime | None = None,
        status: BotScheduleStatus | None = None,
    ) -> list[BotSchedule] | list[dict[str, Any]]:
        query = SqlBuilder.select.table(BotSchedule).where(
            (BotSchedule.column("bot_id") == bot.id)
            & (BotSchedule.column("filterable_table") == filterable_model.__tablename__)
            & (BotSchedule.column("filterable_id") == filterable_model.id)
        )

        if status:
            query = query.where(BotSchedule.column("status") == status)

        if refer_time is not None:
            query = query.where(BotSchedule.column("created_at") <= refer_time)

        if pagination:
            query = query.limit(pagination.limit).offset((pagination.page - 1) * pagination.limit)

        schedules = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            schedules = result.all()

        if not as_api:
            return schedules

        cached_dict = ServiceHelper.get_references(
            [(schedule.target_table, schedule.target_id) for schedule in schedules], as_type="api"
        )

        api_schedules = []
        for schedule in schedules:
            cache_key = f"{schedule.target_table}_{schedule.target_id}"
            target = cached_dict.get(cache_key)
            if not target:
                continue
            api_schedule = schedule.api_response()
            api_schedule["target"] = target
            api_schedules.append(api_schedule)

        return api_schedules

    @staticmethod
    @overload
    async def get_all_by_scope(
        bot: Bot,
        scope_model: BaseSqlModel,
        filterable_model: BaseSqlModel,
        as_api: Literal[False],
        status: BotScheduleStatus | None = None,
    ) -> list[BotSchedule]: ...
    @staticmethod
    @overload
    async def get_all_by_scope(
        bot: Bot,
        scope_model: BaseSqlModel,
        filterable_model: BaseSqlModel,
        as_api: Literal[True],
        status: BotScheduleStatus | None = None,
    ) -> list[dict[str, Any]]: ...
    @staticmethod
    async def get_all_by_scope(
        bot: Bot,
        scope_model: BaseSqlModel,
        filterable_model: BaseSqlModel,
        as_api: bool,
        status: BotScheduleStatus | None = None,
    ) -> list[BotSchedule] | list[dict[str, Any]]:
        query = SqlBuilder.select.table(BotSchedule).where(
            (BotSchedule.column("bot_id") == bot.id)
            & (BotSchedule.column("target_table") == scope_model.__tablename__)
            & (BotSchedule.column("target_id") == scope_model.id)
            & (BotSchedule.column("filterable_table") == filterable_model.__tablename__)
            & (BotSchedule.column("filterable_id") == filterable_model.id)
        )

        if status:
            query = query.where(BotSchedule.column("status") == status)

        schedules = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            schedules = result.all()

        if not as_api:
            return schedules

        api_schedules = []
        for schedule in schedules:
            api_schedule = schedule.api_response()
            api_schedules.append(api_schedule)

        return api_schedules

    @staticmethod
    def reload_cron():
        try:
            for process in process_iter(["pid", "name"]):
                if process.name() != "cron":
                    continue
                process.kill()
            subprocess_run(["crontab", "-r"])
            subprocess_run(["crontab", str(CRON_TAB_FILE)])
            subprocess_run(["cron"])
        except Exception:
            pass

    @staticmethod
    def is_valid_interval_str(interval_str: str) -> bool:
        try:
            job = CronItem()
            job.setall(interval_str)
            return True
        except Exception:
            return False

    @staticmethod
    def get_default_status_with_dates(
        running_type: BotScheduleRunningType | None, start_at: SafeDateTime | None, end_at: SafeDateTime | None
    ) -> tuple[BotScheduleStatus, SafeDateTime | None, SafeDateTime | None] | None:
        if not running_type or running_type == BotScheduleRunningType.Infinite:
            return BotScheduleStatus.Started, None, None

        if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0 and not start_at:
            return None

        if BotSchedule.RUNNING_TYPES_WITH_END_AT.count(running_type) > 0:
            if not end_at:
                return None

            if start_at and end_at < start_at:
                return None
        else:
            end_at = None

        return BotScheduleStatus.Pending, start_at, end_at

    @staticmethod
    async def schedule(
        bot: Bot,
        interval_str: str,
        target_model: BaseSqlModel,
        filterable_model: BaseSqlModel | None = None,
        running_type: BotScheduleRunningType | None = None,
        start_at: SafeDateTime | None = None,
        end_at: SafeDateTime | None = None,
    ) -> BotSchedule | None:
        if not BotScheduleHelper.is_valid_interval_str(interval_str):
            return None

        if not running_type:
            running_type = BotScheduleRunningType.Infinite

        cron = BotScheduleHelper.__get_cron()

        has_changed = BotScheduleHelper.__create_job(cron, interval_str, running_type)

        result = BotScheduleHelper.get_default_status_with_dates(
            running_type=running_type, start_at=start_at, end_at=end_at
        )
        if not result:
            return None
        status, start_at, end_at = result

        bot_schedule = BotSchedule(
            bot_id=bot.id,
            running_type=running_type,
            status=status,
            target_table=target_model.__tablename__,
            target_id=target_model.id,
            filterable_table=filterable_model.__tablename__ if filterable_model else None,
            filterable_id=filterable_model.id if filterable_model else None,
            interval_str=interval_str,
            start_at=start_at,
            end_at=end_at,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(bot_schedule)

        if has_changed:
            BotScheduleHelper.__save_cron(cron)

        return bot_schedule

    @staticmethod
    async def reschedule(
        bot_schedule: _TBotScheduleParam,
        interval_str: str | None = None,
        target_model: BaseSqlModel | None = None,
        filterable_model: BaseSqlModel | None = None,
        running_type: BotScheduleRunningType | None = None,
        start_at: SafeDateTime | None = None,
        end_at: SafeDateTime | None = None,
    ) -> tuple[BotSchedule, dict[str, Any]] | None:
        bot_schedule = ServiceHelper.get_by_param(BotSchedule, bot_schedule)
        if not bot_schedule:
            return None

        model = {}
        has_changed = False
        old_status = bot_schedule.status
        old_interval_str = bot_schedule.interval_str

        cron = None
        if running_type:
            if bot_schedule.running_type != running_type:
                result = BotScheduleHelper.get_default_status_with_dates(
                    running_type=running_type, start_at=start_at, end_at=end_at
                )
                if not result:
                    return None
                status, start_at, end_at = result
                bot_schedule.running_type = running_type
                bot_schedule.status = status
                bot_schedule.start_at = start_at
                bot_schedule.end_at = end_at
                model["running_type"] = running_type.value
                model["status"] = status.value
                model["start_at"] = start_at
                model["end_at"] = end_at

                cron, has_changed = await BotScheduleHelper.change_status(bot_schedule, status, no_update=True)
            else:
                if bot_schedule.start_at != start_at or bot_schedule.end_at != end_at:
                    result = BotScheduleHelper.get_default_status_with_dates(
                        running_type=running_type, start_at=start_at, end_at=end_at
                    )
                    if result:
                        status, _, _ = result
                        bot_schedule.status = status
                        model["status"] = status.value

                if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0 and start_at:
                    bot_schedule.start_at = start_at
                    model["start_at"] = start_at
                if BotSchedule.RUNNING_TYPES_WITH_END_AT.count(running_type) > 0 and end_at:
                    bot_schedule.end_at = end_at
                    model["end_at"] = end_at

        if target_model and (
            target_model.__tablename__ != bot_schedule.target_table or target_model.id != bot_schedule.target_id
        ):
            bot_schedule.target_table = target_model.__tablename__
            bot_schedule.target_id = target_model.id
            model["target_table"] = target_model.__tablename__
            model["target_uid"] = target_model.get_uid()

        if filterable_model and (
            filterable_model.__tablename__ != bot_schedule.filterable_table
            or filterable_model.id != bot_schedule.filterable_id
        ):
            bot_schedule.filterable_table = filterable_model.__tablename__
            bot_schedule.filterable_id = filterable_model.id
            model["filterable_table"] = filterable_model.__tablename__
            model["filterable_uid"] = filterable_model.get_uid()

        if interval_str and BotScheduleHelper.is_valid_interval_str(interval_str) and old_interval_str != interval_str:
            bot_schedule.interval_str = interval_str
            model["interval_str"] = interval_str

            if not cron:
                cron = BotScheduleHelper.__get_cron()

            if (
                bot_schedule.running_type in BotSchedule.RUNNING_TYPES_WITH_START_AT
                and bot_schedule.status == BotScheduleStatus.Pending
            ):
                has_changed = BotScheduleHelper.__create_job(cron, interval_str, running_type) or has_changed
            else:
                has_changed = BotScheduleHelper.__create_job(cron, interval_str) or has_changed

        with DbSession.use(readonly=False) as db:
            db.update(bot_schedule)

        has_old_intervals = BotScheduleHelper.__has_interval_schedule(old_interval_str, old_status)
        if not has_old_intervals:
            if not cron:
                cron = BotScheduleHelper.__get_cron()
            cron.remove_all(
                comment=f"scheduled {old_interval_str}" if old_status == BotScheduleStatus.Pending else old_interval_str
            )

        if cron and (has_changed or not has_old_intervals):
            BotScheduleHelper.__save_cron(cron)

        return bot_schedule, model

    @staticmethod
    async def unschedule(bot_schedule: _TBotScheduleParam) -> BotSchedule | None:
        bot_schedule = ServiceHelper.get_by_param(BotSchedule, bot_schedule)
        if not bot_schedule:
            return None

        cron = BotScheduleHelper.__get_cron()

        status = bot_schedule.status
        interval_str = bot_schedule.interval_str
        with DbSession.use(readonly=False) as db:
            db.delete(bot_schedule)

        has_interval = BotScheduleHelper.__has_interval_schedule(interval_str, status)
        if not has_interval:
            cron.remove_all(
                comment=f"scheduled {interval_str}" if status == BotScheduleStatus.Pending else interval_str
            )
            BotScheduleHelper.__save_cron(cron)
        return bot_schedule

    @overload
    @staticmethod
    async def change_status(bot_schedule: _TBotScheduleParam, status: BotScheduleStatus) -> BotSchedule | None: ...
    @overload
    @staticmethod
    async def change_status(
        bot_schedule: _TBotScheduleParam, status: BotScheduleStatus, no_update: Literal[False]
    ) -> BotSchedule | None: ...
    @overload
    @staticmethod
    async def change_status(
        bot_schedule: _TBotScheduleParam, status: BotScheduleStatus, no_update: Literal[True]
    ) -> tuple[CronTab, bool]: ...
    @staticmethod
    async def change_status(
        bot_schedule: _TBotScheduleParam, status: BotScheduleStatus, no_update: bool = False
    ) -> BotSchedule | tuple[CronTab, bool] | None:
        bot_schedule = ServiceHelper.get_by_param(BotSchedule, bot_schedule)
        cron = BotScheduleHelper.__get_cron()
        if not bot_schedule:
            return None if not no_update else (cron, False)

        old_status = bot_schedule.status
        bot_schedule.status = status
        if not no_update:
            with DbSession.use(readonly=False) as db:
                db.update(bot_schedule)

        has_changed = False
        has_old_intervals = True
        old_comment = bot_schedule.interval_str
        if old_status == BotScheduleStatus.Pending and status == BotScheduleStatus.Started:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str)
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
            old_comment = f"scheduled {bot_schedule.interval_str}"
        elif old_status == BotScheduleStatus.Started and status == BotScheduleStatus.Pending:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str, bot_schedule.running_type)
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
        elif old_status == BotScheduleStatus.Started and status == BotScheduleStatus.Stopped:
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
        elif old_status == BotScheduleStatus.Stopped and status == BotScheduleStatus.Started:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str)
        elif old_status == BotScheduleStatus.Pending and status == BotScheduleStatus.Stopped:
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
            old_comment = f"scheduled {bot_schedule.interval_str}"
        elif old_status == BotScheduleStatus.Stopped and status == BotScheduleStatus.Pending:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str, bot_schedule.running_type)

        if not has_old_intervals:
            cron.remove_all(comment=old_comment)

        if has_changed or not has_old_intervals:
            BotScheduleHelper.__save_cron(cron)
        return bot_schedule if not no_update else (cron, has_changed)

    @staticmethod
    def __get_cron():
        if not CRON_TAB_FILE.exists():
            CRON_TAB_FILE.parent.mkdir(parents=True, exist_ok=True)
            CRON_TAB_FILE.touch()
        cron = CronTab(user=False, tabfile=str(CRON_TAB_FILE))
        if cron.env is None:
            cron.env = OrderedVariableList()
        cron.env.update(environ)

        return cron

    @staticmethod
    def __create_job(cron: CronTab, interval_str: str, running_type: BotScheduleRunningType | None = None) -> bool:
        comment = None
        if running_type:
            if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0:
                comment = f"scheduled {interval_str}"
        if comment is None:
            comment = interval_str

        has_job = False
        for job in cron.find_comment(comment):
            has_job = True
            break

        if has_job:
            return False

        job = cron.new(command=f"/app/scripts/run_bot_cron.sh '{comment}'", comment=comment, user="/bin/bash")
        job.setall(interval_str)
        return True

    @staticmethod
    def __save_cron(cron: CronTab):
        cron.write()
        BotScheduleHelper.reload_cron()

    @staticmethod
    def __has_interval_schedule(interval_str: str, status: BotScheduleStatus) -> bool:
        result = False
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(BotSchedule)
                .where((BotSchedule.column("interval_str") == interval_str) & (BotSchedule.column("status") == status))
                .limit(1)
            )
            result = bool(result.first())
        return result
