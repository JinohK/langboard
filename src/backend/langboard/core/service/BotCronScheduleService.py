from typing import Any, Literal, cast, overload
from crontab import CronItem, CronTab
from ...Constants import CRON_TAB_FILE
from ..ai import Bot, BotSchedule
from ..db import BaseSqlModel, DbSession, SnowflakeID, SqlBuilder
from ..utils.decorators import staticclass
from ..utils.ModelUtils import get_model_by_table_name


@staticclass
class BotCronScheduleService:
    @staticmethod
    @overload
    async def get_all_by_filterable(
        bot: Bot, filterable_model: BaseSqlModel, as_api: Literal[False]
    ) -> list[BotSchedule]: ...
    @staticmethod
    @overload
    async def get_all_by_filterable(
        bot: Bot, filterable_model: BaseSqlModel, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    @staticmethod
    async def get_all_by_filterable(
        bot: Bot, filterable_model: BaseSqlModel, as_api: bool
    ) -> list[BotSchedule] | list[dict[str, Any]]:
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(BotSchedule).where(
                    (BotSchedule.column("bot_id") == bot.id)
                    & (BotSchedule.column("filterable_table") == filterable_model.__tablename__)
                    & (BotSchedule.column("filterable_id") == filterable_model.id)
                )
            )

        if not as_api:
            return list(result.all())

        schedules = []
        for schedule in result.all():
            target_table = get_model_by_table_name(schedule.target_table)
            if not target_table:
                continue

            async with DbSession.use() as db:
                result = await db.exec(
                    SqlBuilder.select.table(target_table).where(target_table.column("id") == schedule.target_id)
                )
            target = result.first()
            if not target:
                continue

            api_schedule = schedule.api_response()
            api_schedule["target"] = target.api_response()
            schedules.append(api_schedule)

        return schedules

    @staticmethod
    def is_valid_interval_str(interval_str: str) -> bool:
        try:
            job = CronItem()
            job.setall(interval_str)
            return True
        except Exception:
            return False

    @staticmethod
    async def schedule(
        bot: Bot, interval_str: str, target_model: BaseSqlModel, filterable_model: BaseSqlModel | None = None
    ) -> BotSchedule | None:
        if not BotCronScheduleService.is_valid_interval_str(interval_str):
            return None

        cron = BotCronScheduleService.__get_cron()

        has_changed = BotCronScheduleService.__create_job(cron, interval_str)

        bot_schedule = BotSchedule(
            bot_id=bot.id,
            target_table=target_model.__tablename__,
            target_id=target_model.id,
            filterable_table=filterable_model.__tablename__ if filterable_model else None,
            filterable_id=filterable_model.id if filterable_model else None,
            interval_str=interval_str,
        )

        async with DbSession.use() as db:
            db.insert(bot_schedule)
            await db.commit()

        if has_changed:
            cron.write()

        return bot_schedule

    @staticmethod
    async def reschedule(
        bot_schedule: BotSchedule | str,
        interval_str: str | None = None,
        target_model: BaseSqlModel | None = None,
        filterable_model: BaseSqlModel | None = None,
    ) -> tuple[BotSchedule, dict[str, Any]] | None:
        bot_schedule = await BotCronScheduleService.__get_schedule(bot_schedule)
        if not bot_schedule:
            return None

        model = {}
        has_changed = False
        if interval_str and BotCronScheduleService.is_valid_interval_str(interval_str):
            cron = BotCronScheduleService.__get_cron()

            old_interval_str = bot_schedule.interval_str
            has_changed = BotCronScheduleService.__create_job(cron, interval_str)

            bot_schedule.interval_str = interval_str
            model["interval_str"] = interval_str

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

        async with DbSession.use() as db:
            await db.update(bot_schedule)
            await db.commit()

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(BotSchedule).where(BotSchedule.column("interval_str") == old_interval_str)
            )
        has_result = bool(result.first())

        if not has_result:
            cron.remove_all(comment=old_interval_str)

        if has_changed or has_result:
            cron.write()

        return bot_schedule, model

    @staticmethod
    async def unschedule(bot_schedule: BotSchedule | str) -> BotSchedule | None:
        bot_schedule = await BotCronScheduleService.__get_schedule(bot_schedule)
        if not bot_schedule:
            return None

        cron = BotCronScheduleService.__get_cron()

        interval_str = bot_schedule.interval_str
        async with DbSession.use() as db:
            await db.delete(bot_schedule)
            await db.commit()

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(BotSchedule).where(BotSchedule.column("interval_str") == interval_str)
            )

        if not result.first():
            cron.remove_all(comment=interval_str)
            cron.write()

        return bot_schedule

    @staticmethod
    def __get_cron():
        if not CRON_TAB_FILE.exists():
            CRON_TAB_FILE.parent.mkdir(parents=True, exist_ok=True)
            CRON_TAB_FILE.touch()
        return CronTab(user=False, tabfile=str(CRON_TAB_FILE))

    @staticmethod
    async def __get_schedule(bot_schedule: BotSchedule | str):
        if isinstance(bot_schedule, str):
            async with DbSession.use() as db:
                result = await db.exec(
                    SqlBuilder.select.table(BotSchedule).where(
                        BotSchedule.column("id") == SnowflakeID.from_short_code(bot_schedule)
                    )
                )
            bot_schedule = cast(BotSchedule, result.first())

        return bot_schedule

    @staticmethod
    def __create_job(cron: CronTab, interval_str: str) -> bool:
        has_job = False
        for job in cron.find_comment(interval_str):
            has_job = True
            break

        if has_job:
            return False

        job = cron.new(command=f"langboard run:bot:task '{interval_str}'", comment=interval_str, user="root")
        job.setall(interval_str)
        return True
