from datetime import datetime
from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SqlBuilder, User
from ...core.schema import Pagination
from ...core.service import BaseService, ServiceHelper
from ...core.utils.DateTime import calculate_time_diff_in_seconds, now
from ...models import Card, Checkitem, CheckitemTimerRecord, Checklist, Project, ProjectColumn
from ...models.Checkitem import CheckitemStatus
from ...publishers import CheckitemPublisher
from ...tasks.activities import CardCheckitemActivityTask
from ...tasks.bot import CardBotTask, CardCheckitemBotTask
from .Types import TCardParam, TCheckitemParam, TChecklistParam, TProjectParam, TUserOrBot


class CheckitemService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checkitem"

    async def get_by_uid(self, uid: str) -> Checkitem | None:
        return await ServiceHelper.get_by_param(Checkitem, uid)

    @overload
    async def get_list(
        self, card: TCardParam, checklist: TChecklistParam, as_api: Literal[False]
    ) -> list[tuple[Checkitem, Card | None, User | None]]: ...
    @overload
    async def get_list(
        self, card: TCardParam, checklist: TChecklistParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_list(
        self, card: TCardParam, checklist: TChecklistParam, as_api: bool
    ) -> list[tuple[Checkitem, Card | None, User | None]] | list[dict[str, Any]]:
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        checklist = cast(Checklist, await ServiceHelper.get_by_param(Checklist, checklist))
        if not card or not checklist or checklist.card_id != card.id:
            return []

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(Checkitem, Card, User)
                .outerjoin(Card, Card.column("id") == Checkitem.column("cardified_id"))
                .outerjoin(User, User.column("id") == Checkitem.column("user_id"))
                .where(Checkitem.column("checklist_id") == checklist.id)
            )
        records = result.all()
        if not as_api:
            return list(records)
        checkitems = []
        for checkitem, cardified_card, user in records:
            api_checkitem = checkitem.api_response()
            api_checkitem["card_uid"] = card.get_uid()
            last_timer = await self.__get_timer_record(checkitem, "last")
            if last_timer and last_timer.status == CheckitemStatus.Started:
                api_checkitem["timer_started_at"] = last_timer.created_at
            if cardified_card:
                api_checkitem["cardified_card"] = cardified_card.api_response()
            if user:
                api_checkitem["user"] = user.api_response()
            checkitems.append(api_checkitem)
        return checkitems

    async def get_track_list(
        self, user: User, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
        query = (
            SqlBuilder.select.tables(Checkitem, Card, Project)
            .join(Checklist, Checklist.column("id") == Checkitem.column("checklist_id"))
            .join(Card, Card.column("id") == Checklist.column("card_id"))
            .join(Project, Project.column("id") == Card.column("project_id"))
            .where((Checkitem.column("user_id") == user.id) & (Checkitem.column("created_at") <= refer_time))
            .order_by(Checkitem.column("created_at").desc())
            .group_by(Checkitem.column("id"), Checkitem.column("created_at"))
        )
        query = ServiceHelper.paginate(query, pagination.page, pagination.limit)
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(query)
        records = result.all()

        api_checkitems = []
        api_cards: dict[int, dict[str, Any]] = {}
        api_projects: dict[int, dict[str, Any]] = {}
        for checkitem, card, project in records:
            api_checkitem = checkitem.api_response()
            api_checkitem["card_uid"] = card.get_uid()
            first_timer = await self.__get_timer_record(checkitem, "first")
            if first_timer:
                api_checkitem["initial_timer_started_at"] = first_timer.created_at
            last_timer = await self.__get_timer_record(checkitem, "last")
            if last_timer and last_timer.status == CheckitemStatus.Started:
                api_checkitem["timer_started_at"] = last_timer.created_at

            if card.id not in api_cards:
                api_cards[card.id] = card.api_response()

            if project.id not in api_projects:
                api_projects[project.id] = project.api_response()
            api_checkitems.append(api_checkitem)

        return api_checkitems, list(api_cards.values()), list(api_projects.values())

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, checklist: TChecklistParam, title: str
    ) -> Checkitem | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card, _ = params
        checklist = cast(Checklist, await ServiceHelper.get_by_param(Checklist, checklist))
        if not checklist or checklist.card_id != card.id:
            return None

        max_order = await ServiceHelper.get_max_order(Checkitem, "checklist_id", checklist.id)

        checkitem = Checkitem(checklist_id=checklist.id, title=title, order=max_order + 1)
        async with DbSession.use(readonly=False) as db:
            await db.insert(checkitem)

        CheckitemPublisher.created(card, checklist, checkitem)
        CardCheckitemActivityTask.card_checkitem_created(user_or_bot, project, card, checkitem)
        CardCheckitemBotTask.card_checkitem_created(user_or_bot, project, card, checkitem)

        return checkitem

    async def change_title(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        title: str,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        old_title = checkitem.title
        checkitem.title = title
        cardified_card = None
        async with DbSession.use(readonly=False) as db:
            if checkitem.cardified_id:
                cardified_card = await ServiceHelper.get_by(Card, "id", checkitem.cardified_id)
                if not cardified_card:
                    checkitem.cardified_id = None
                else:
                    cardified_card.title = title
                    await db.update(cardified_card)

            await db.update(checkitem)

        CheckitemPublisher.title_changed(project, card, checkitem, cardified_card)
        CardCheckitemActivityTask.card_checkitem_title_changed(user_or_bot, project, card, old_title, checkitem)
        CardCheckitemBotTask.card_checkitem_title_changed(user_or_bot, project, card, checkitem)

        return True

    async def change_order(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        order: int,
        checklist_uid: str = "",
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        original_order = checkitem.order
        original_checklist = None
        new_checklist = None
        if checklist_uid:
            original_checklist = await ServiceHelper.get_by_param(Checklist, checkitem.checklist_id)
            new_checklist = await ServiceHelper.get_by_param(Checklist, checklist_uid)
            if (
                not original_checklist
                or not new_checklist
                or original_checklist.card_id != card.id
                or new_checklist.card_id != card.id
            ):
                return None

        async with DbSession.use(readonly=False) as db:
            shared_update_query = SqlBuilder.update.table(Checkitem)
            if original_checklist and new_checklist:
                update_query = shared_update_query.values({Checkitem.order: Checkitem.order - 1}).where(
                    (Checkitem.column("order") >= original_order)
                    & (Checkitem.column("checklist_id") == original_checklist.id)
                )
                await db.exec(update_query)

                update_query = shared_update_query.values({Checkitem.order: Checkitem.order + 1}).where(
                    (Checkitem.column("order") >= order) & (Checkitem.column("checklist_id") == new_checklist.id)
                )
                await db.exec(update_query)

                checkitem.checklist_id = new_checklist.id
            else:
                update_query = shared_update_query.where(Checkitem.column("checklist_id") == checkitem.checklist_id)
                update_query = ServiceHelper.set_order_in_column(update_query, Checkitem, original_order, order)
                await db.exec(update_query)

            checkitem.order = order
            await db.update(checkitem)

        CheckitemPublisher.order_changed(card, checkitem, original_checklist, new_checklist)

        return True

    async def change_status(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        status: CheckitemStatus,
        current_time: datetime | None = None,
        should_publish: bool = True,
        from_api: bool = False,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params
        if checkitem.cardified_id:
            return False

        if checkitem.status == status:
            return True

        if not current_time:
            current_time = now()

        async with DbSession.use(readonly=False) as db:
            if status != CheckitemStatus.Started:
                if not checkitem.user_id:
                    return False

                if checkitem.status == CheckitemStatus.Started:
                    last_timer_record = cast(CheckitemTimerRecord, await self.__get_timer_record(checkitem, "last"))
                    accumulated_seconds = calculate_time_diff_in_seconds(current_time, last_timer_record.created_at)
                    checkitem.accumulated_seconds += accumulated_seconds
                    await db.update(checkitem)
            else:
                if not checkitem.user_id:
                    if not isinstance(user_or_bot, User):
                        return False
                    checkitem.user_id = user_or_bot.id
                if isinstance(user_or_bot, User):
                    started_checkitem = await self.__find_started_checkitem(user_or_bot)
                    if started_checkitem:
                        await self.change_status(
                            user_or_bot, project, card, started_checkitem, CheckitemStatus.Paused, current_time
                        )
                checkitem.is_checked = False

            if status == CheckitemStatus.Stopped and from_api:
                checkitem.is_checked = True

            checkitem.status = status
            timer_record = CheckitemTimerRecord(checkitem_id=checkitem.id, status=status, created_at=current_time)
            await db.update(checkitem)
            await db.insert(timer_record)

        target_user = None
        if checkitem.user_id:
            target_user = await ServiceHelper.get_by(User, "id", checkitem.user_id)

        if should_publish:
            CheckitemPublisher.status_changed(project, card, checkitem, timer_record, target_user)

        if status == CheckitemStatus.Started:
            CardCheckitemActivityTask.card_checkitem_timer_started(user_or_bot, project, card, checkitem)
            CardCheckitemBotTask.card_checkitem_timer_started(user_or_bot, project, card, checkitem)
        elif status == CheckitemStatus.Paused:
            CardCheckitemActivityTask.card_checkitem_timer_paused(user_or_bot, project, card, checkitem)
            CardCheckitemBotTask.card_checkitem_timer_paused(user_or_bot, project, card, checkitem)
        elif status == CheckitemStatus.Stopped:
            CardCheckitemActivityTask.card_checkitem_timer_stopped(user_or_bot, project, card, checkitem)
            CardCheckitemBotTask.card_checkitem_timer_stopped(user_or_bot, project, card, checkitem)

        return True

    async def toggle_checked(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        checkitem.is_checked = not checkitem.is_checked

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, project, card, checkitem, CheckitemStatus.Stopped)
        else:
            async with DbSession.use(readonly=False) as db:
                await db.update(checkitem)

            CheckitemPublisher.checked_changed(project, card, checkitem)

        if checkitem.is_checked:
            CardCheckitemActivityTask.card_checkitem_checked(user_or_bot, project, card, checkitem)
            CardCheckitemBotTask.card_checkitem_checked(user_or_bot, project, card, checkitem)
        else:
            CardCheckitemActivityTask.card_checkitem_unchecked(user_or_bot, project, card, checkitem)
            CardCheckitemBotTask.card_checkitem_unchecked(user_or_bot, project, card, checkitem)

        return True

    async def cardify(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        column_uid: str | None = None,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        if checkitem.cardified_id or (card.archived_at and not column_uid):
            return False

        target_column = await ServiceHelper.get_by_param(ProjectColumn, column_uid or card.project_column_id)
        if not target_column or target_column.is_archive:
            return False

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, project, card, checkitem, CheckitemStatus.Stopped)

        max_order = await ServiceHelper.get_max_order(
            Card, "project_id", card.project_id, {"project_column_id": target_column.id}
        )
        new_card = Card(
            project_id=card.project_id,
            project_column_id=target_column.id,
            title=checkitem.title,
            order=max_order + 1,
        )
        async with DbSession.use(readonly=False) as db:
            await db.insert(new_card)
            checkitem.cardified_id = new_card.id
            await db.update(checkitem)

        api_card = new_card.board_api_response(0, [], [], [], [])
        CheckitemPublisher.cardified(card, checkitem, target_column, api_card)
        CardCheckitemActivityTask.card_checkitem_cardified(user_or_bot, project, card, checkitem)
        CardCheckitemBotTask.card_checkitem_cardified(user_or_bot, project, card, checkitem, new_card)
        CardBotTask.card_created(user_or_bot, project, new_card)

        return True

    async def delete(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, project, card, checkitem, CheckitemStatus.Stopped)

        async with DbSession.use(readonly=False) as db:
            await db.delete(checkitem)

        CheckitemPublisher.deleted(project, card, checkitem)
        CardCheckitemActivityTask.card_checkitem_deleted(user_or_bot, project, card, checkitem)
        CardCheckitemBotTask.card_checkitem_deleted(user_or_bot, project, card, checkitem)

        return True

    async def __get_timer_record(self, checkitem: Checkitem, arc_type: Literal["first", "last"]):
        order_by = (
            CheckitemTimerRecord.column("created_at").asc()
            if arc_type == "first"
            else CheckitemTimerRecord.column("created_at").desc()
        )
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(CheckitemTimerRecord)
                .where(CheckitemTimerRecord.column("checkitem_id") == checkitem.id)
                .order_by(order_by)
                .group_by(CheckitemTimerRecord.column("id"), CheckitemTimerRecord.column("created_at"))
                .limit(1)
            )
        return result.first()

    async def __find_started_checkitem(self, user: User):
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(Checkitem).where(
                    (Checkitem.column("user_id") == user.id) & (Checkitem.column("status") == CheckitemStatus.Started)
                )
            )
        return result.first()

    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam
    ) -> tuple[Project, Card, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, checkitem: TCheckitemParam
    ) -> tuple[Project, Card, Checkitem] | None: ...
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, checkitem: TCheckitemParam | None = None
    ) -> tuple[Project, Card, Checkitem | None] | None:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not card or not project or card.project_id != project.id:
            return None

        if checkitem:
            checkitem = cast(Checkitem, await ServiceHelper.get_by_param(Checkitem, checkitem))
            if not checkitem:
                return None
        else:
            checkitem = None

        return project, card, checkitem
