from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...models import Card, Checkitem, Checklist, Project
from ...models.Checkitem import CheckitemStatus
from ...publishers import ChecklistPublisher
from ...tasks.activities import CardChecklistActivityTask
from ...tasks.bot import CardChecklistBotTask
from .CheckitemService import CheckitemService
from .NotificationService import NotificationService
from .ProjectService import ProjectService
from .Types import TCardParam, TChecklistParam, TProjectParam, TUserOrBot


class ChecklistService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checklist"

    @overload
    async def get_list(
        self, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[Checklist, list[tuple[Checkitem, Card | None, User | None]]]]: ...
    @overload
    async def get_list(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_list(
        self, card: TCardParam, as_api: bool
    ) -> list[tuple[Checklist, list[tuple[Checkitem, Card | None, User | None]]]] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []

        raw_checklists = await self._get_all_by(Checklist, "card_id", card.id)
        if not raw_checklists:
            return []

        checkitem_service = self._get_service(CheckitemService)
        checklists = []
        for raw_checklist in raw_checklists:
            checkitems = await checkitem_service.get_list(card, raw_checklist, cast(Literal[False], as_api))
            if not as_api:
                checklists.append((raw_checklist, checkitems))
            else:
                checklists.append(
                    {
                        **raw_checklist.api_response(),
                        "checkitems": checkitems,
                    }
                )

        return checklists

    @overload
    async def get_list_only(self, card: TCardParam, as_api: Literal[False]) -> list[Checklist]: ...
    @overload
    async def get_list_only(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_list_only(self, card: TCardParam, as_api: bool) -> list[Checklist] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []

        raw_checklists = await self._get_all_by(Checklist, "card_id", card.id)
        if not as_api:
            return list(raw_checklists)

        return [checklist.api_response() for checklist in raw_checklists]

    async def get_list_only_by_project(self, project: TProjectParam) -> list[Checklist]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(Checklist)
                .join(Card, Checklist.column("card_id") == Card.column("id"))
                .where(Card.column("project_id") == project.id)
            )
        return list(result.all())

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, title: str
    ) -> Checklist | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card, _ = params

        max_order = await self._get_max_order(Checklist, "card_id", card.id)

        checklist = Checklist(card_id=card.id, title=title, order=max_order + 1)
        async with DbSession.use(readonly=False) as db:
            await db.insert(checklist)

        ChecklistPublisher.created(card, checklist)
        CardChecklistActivityTask.card_checklist_created(user_or_bot, project, card, checklist)
        CardChecklistBotTask.card_checklist_created(user_or_bot, project, card, checklist)

        return checklist

    async def change_title(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, checklist: TChecklistParam, title: str
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checklist)
        if not params:
            return None
        project, card, checklist = params

        if checklist.title == title:
            return True

        old_title = checklist.title
        checklist.title = title
        async with DbSession.use(readonly=False) as db:
            await db.update(checklist)

        ChecklistPublisher.title_changed(card, checklist)
        CardChecklistActivityTask.card_checklist_title_changed(user_or_bot, project, card, old_title, checklist)
        CardChecklistBotTask.card_checklist_title_changed(user_or_bot, project, card, checklist)

        return True

    async def change_order(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, checklist: TChecklistParam, order: int
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checklist)
        if not params:
            return None
        project, card, checklist = params

        original_order = checklist.order
        update_query = SqlBuilder.update.table(Checklist).where(Checklist.column("card_id") == card.id)
        update_query = self._set_order_in_column(update_query, Checklist, original_order, order)
        async with DbSession.use(readonly=False) as db:
            await db.exec(update_query)
            checklist.order = order
            await db.update(checklist)

        ChecklistPublisher.order_changed(card, checklist)

        return True

    async def toggle_checked(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, checklist: TChecklistParam
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checklist)
        if not params:
            return None
        project, card, checklist = params

        checklist.is_checked = not checklist.is_checked
        async with DbSession.use(readonly=False) as db:
            await db.update(checklist)

        ChecklistPublisher.checked_changed(card, checklist)

        if checklist.is_checked:
            CardChecklistActivityTask.card_checklist_checked(user_or_bot, project, card, checklist)
            CardChecklistBotTask.card_checklist_checked(user_or_bot, project, card, checklist)
        else:
            CardChecklistActivityTask.card_checklist_unchecked(user_or_bot, project, card, checklist)
            CardChecklistBotTask.card_checklist_unchecked(user_or_bot, project, card, checklist)

        return True

    async def notify(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        checklist: TChecklistParam,
        user_uids: list[str],
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checklist)
        if not params:
            return None
        project, card, checklist = params

        project_service = self._get_service(ProjectService)
        assigned_users = await project_service.get_assigned_users(
            project, as_api=False, where_user_ids_in=[SnowflakeID.from_short_code(user_uid) for user_uid in user_uids]
        )

        for user, _ in assigned_users:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_checklist(user_or_bot, user, project, card, checklist)

        return True

    async def delete(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, checklist: TChecklistParam
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, checklist)
        if not params:
            return None
        project, card, checklist = params

        checkitem_service = self._get_service(CheckitemService)
        checkitems = await checkitem_service.get_list(card, checklist, as_api=False)
        current_time = now()
        for checkitem, _, _ in checkitems:
            await checkitem_service.change_status(
                user_or_bot, project, card, checkitem, CheckitemStatus.Stopped, current_time, should_publish=False
            )

        async with DbSession.use(readonly=False) as db:
            await db.delete(checklist)

        ChecklistPublisher.deleted(card, checklist)
        CardChecklistActivityTask.card_checklist_deleted(user_or_bot, project, card, checklist)
        CardChecklistBotTask.card_checklist_deleted(user_or_bot, project, card, checklist)

        return True

    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam
    ) -> tuple[Project, Card, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, checklist: TChecklistParam
    ) -> tuple[Project, Card, Checklist] | None: ...
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, checklist: TChecklistParam | None = None
    ) -> tuple[Project, Card, Checklist | None] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not card or not project or card.project_id != project.id:
            return None

        if checklist:
            checklist = cast(Checklist, await self._get_by_param(Checklist, checklist))
            if not checklist or checklist.card_id != card.id:
                return None
        else:
            checklist = None

        return project, card, checklist
