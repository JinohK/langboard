from typing import Any, Literal, cast, overload
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.utils.DateTime import now
from ...models import Card, CheckGroup, Checkitem, Project
from ...models.Checkitem import CheckitemStatus
from .CheckitemService import CheckitemService
from .NotificationService import NotificationService
from .Types import TCardParam, TCheckGroupParam, TUserOrBot


_SOCKET_PREFIX = "board:card:checkgroup"


class CheckGroupService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "check_group"

    @overload
    async def get_list(
        self, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[CheckGroup, list[tuple[Checkitem, Card | None, User | None]]]]: ...
    @overload
    async def get_list(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_list(
        self, card: TCardParam, as_api: bool
    ) -> list[tuple[CheckGroup, list[tuple[Checkitem, Card | None, User | None]]]] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []

        raw_check_groups = await self._get_all_by(CheckGroup, "card_id", card.id)
        if not raw_check_groups:
            return []

        checkitem_service = self._get_service(CheckitemService)
        check_groups = []
        for raw_check_group in raw_check_groups:
            checkitems = await checkitem_service.get_list(card, raw_check_group, cast(Literal[False], as_api))
            if not as_api:
                check_groups.append((raw_check_group, checkitems))
            else:
                check_groups.append(
                    {
                        **raw_check_group.api_response(),
                        "checkitems": checkitems,
                    }
                )

        return check_groups

    async def create(self, user_or_bot: TUserOrBot, card: TCardParam, title: str) -> CheckGroup | None:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return None

        max_order = await self._get_max_order(CheckGroup, "card_id", card.id)

        check_group = CheckGroup(card_id=card.id, title=title, order=max_order + 1)
        self._db.insert(check_group)
        await self._db.commit()

        model = {"check_group": {**check_group.api_response(), "checkitems": []}}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:created",
            data_keys="check_group",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return check_group

    async def change_title(
        self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam, title: str
    ) -> bool | None:
        params = await self.__get_records_by_params(card, check_group)
        if not params:
            return None
        card, check_group = params

        if check_group.title == title:
            return True

        check_group.title = title
        await self._db.update(check_group)
        await self._db.commit()

        model = {"title": title}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:title:changed:{check_group.get_uid()}",
            data_keys="title",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def change_order(
        self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam, order: int
    ) -> bool | None:
        params = await self.__get_records_by_params(card, check_group)
        if not params:
            return None
        card, check_group = params

        original_order = check_group.order
        update_query = self._db.query("update").table(CheckGroup).where(CheckGroup.column("card_id") == card.id)
        if original_order < order:
            update_query = update_query.values({CheckGroup.order: CheckGroup.order - 1}).where(
                (CheckGroup.column("order") <= order) & (CheckGroup.column("order") > original_order)
            )
        else:
            update_query = update_query.values({CheckGroup.order: CheckGroup.order + 1}).where(
                (CheckGroup.column("order") >= order) & (CheckGroup.column("order") < original_order)
            )
        await self._db.exec(update_query)

        check_group.order = order
        await self._db.update(check_group)
        await self._db.commit()

        model = {"uid": check_group.get_uid(), "order": order}
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
        self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam
    ) -> bool | None:
        params = await self.__get_records_by_params(card, check_group)
        if not params:
            return None
        card, check_group = params

        check_group.is_checked = not check_group.is_checked
        await self._db.update(check_group)
        await self._db.commit()

        model = {"is_checked": check_group.is_checked}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:checked:changed:{check_group.get_uid()}",
            data_keys="is_checked",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def notify(
        self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam, user_uids: list[str]
    ) -> bool | None:
        params = await self.__get_records_by_params(card, check_group)
        if not params:
            return None
        card, check_group = params

        project = await self._get_by_param(Project, card.project_id)
        if not project:
            return None

        for user_uid in user_uids:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_check_group(user_or_bot, user_uid, project, card, check_group)

        return True

    async def delete(self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam) -> bool | None:
        params = await self.__get_records_by_params(card, check_group)
        if not params:
            return None
        card, check_group = params

        checkitem_service = self._get_service(CheckitemService)
        checkitems = await checkitem_service.get_list(card, check_group, as_api=False)
        current_time = now()
        for checkitem, _, _ in checkitems:
            await checkitem_service.change_status(
                user_or_bot, card, checkitem, CheckitemStatus.Stopped, current_time, should_publish=False
            )

        await self._db.delete(check_group)

        model = {"uid": check_group.get_uid()}
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
        self, card: TCardParam, check_group: TCheckGroupParam
    ) -> tuple[Card, CheckGroup] | None:
        card = cast(Card, await self._get_by_param(Card, card))
        check_group = cast(CheckGroup, await self._get_by_param(CheckGroup, check_group))
        if not card or not check_group or card.id != check_group.card_id:
            return None

        return card, check_group
