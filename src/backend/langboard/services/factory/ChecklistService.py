from typing import Any, Literal, cast, overload
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.utils.DateTime import now
from ...models import Card, Checkitem, Checklist, Project
from ...models.Checkitem import CheckitemStatus
from .CheckitemService import CheckitemService
from .NotificationService import NotificationService
from .Types import TCardParam, TChecklistParam, TUserOrBot


_SOCKET_PREFIX = "board:card:checklist"


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

    async def create(self, user_or_bot: TUserOrBot, card: TCardParam, title: str) -> Checklist | None:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return None

        max_order = await self._get_max_order(Checklist, "card_id", card.id)

        checklist = Checklist(card_id=card.id, title=title, order=max_order + 1)
        self._db.insert(checklist)
        await self._db.commit()

        model = {"checklist": {**checklist.api_response(), "checkitems": []}}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:created",
            data_keys="checklist",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return checklist

    async def change_title(
        self, user_or_bot: TUserOrBot, card: TCardParam, checklist: TChecklistParam, title: str
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checklist)
        if not params:
            return None
        card, checklist = params

        if checklist.title == title:
            return True

        checklist.title = title
        await self._db.update(checklist)
        await self._db.commit()

        model = {"title": title}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:title:changed:{checklist.get_uid()}",
            data_keys="title",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def change_order(
        self, user_or_bot: TUserOrBot, card: TCardParam, checklist: TChecklistParam, order: int
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checklist)
        if not params:
            return None
        card, checklist = params

        original_order = checklist.order
        update_query = self._db.query("update").table(Checklist).where(Checklist.column("card_id") == card.id)
        if original_order < order:
            update_query = update_query.values({Checklist.order: Checklist.order - 1}).where(
                (Checklist.column("order") <= order) & (Checklist.column("order") > original_order)
            )
        else:
            update_query = update_query.values({Checklist.order: Checklist.order + 1}).where(
                (Checklist.column("order") >= order) & (Checklist.column("order") < original_order)
            )
        await self._db.exec(update_query)

        checklist.order = order
        await self._db.update(checklist)
        await self._db.commit()

        model = {"uid": checklist.get_uid(), "order": order}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:order:changed:{topic_id}",
            data_keys=["uid", "order"],
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def toggle_checked(
        self, user_or_bot: TUserOrBot, card: TCardParam, checklist: TChecklistParam
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checklist)
        if not params:
            return None
        card, checklist = params

        checklist.is_checked = not checklist.is_checked
        await self._db.update(checklist)
        await self._db.commit()

        model = {"is_checked": checklist.is_checked}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:checked:changed:{checklist.get_uid()}",
            data_keys="is_checked",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def notify(
        self, user_or_bot: TUserOrBot, card: TCardParam, checklist: TChecklistParam, user_uids: list[str]
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checklist)
        if not params:
            return None
        card, checklist = params

        project = await self._get_by_param(Project, card.project_id)
        if not project:
            return None

        for user_uid in user_uids:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_checklist(user_or_bot, user_uid, project, card, checklist)

        return True

    async def delete(self, user_or_bot: TUserOrBot, card: TCardParam, checklist: TChecklistParam) -> bool | None:
        params = await self.__get_records_by_params(card, checklist)
        if not params:
            return None
        card, checklist = params

        checkitem_service = self._get_service(CheckitemService)
        checkitems = await checkitem_service.get_list(card, checklist, as_api=False)
        current_time = now()
        for checkitem, _, _ in checkitems:
            await checkitem_service.change_status(
                user_or_bot, card, checkitem, CheckitemStatus.Stopped, current_time, should_publish=False
            )

        await self._db.delete(checklist)

        model = {"uid": checklist.get_uid()}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:deleted",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def __get_records_by_params(
        self, card: TCardParam, checklist: TChecklistParam
    ) -> tuple[Card, Checklist] | None:
        card = cast(Card, await self._get_by_param(Card, card))
        checklist = cast(Checklist, await self._get_by_param(Checklist, checklist))
        if not card or not checklist or card.id != checklist.card_id:
            return None

        return card, checklist
