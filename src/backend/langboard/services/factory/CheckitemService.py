from datetime import datetime
from typing import Any, Literal, cast, overload
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...core.utils.DateTime import calculate_time_diff_in_seconds, now
from ...models import Card, CheckGroup, Checkitem, CheckitemTimerRecord, ProjectColumn
from ...models.Checkitem import CheckitemStatus
from .Types import TCardParam, TCheckGroupParam, TCheckitemParam, TUserOrBot


_SOCKET_PREFIX = "board:card:checkitem"


class CheckitemService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checkitem"

    async def get_by_uid(self, uid: str) -> Checkitem | None:
        return await self._get_by(Checkitem, "uid", uid)

    @overload
    async def get_list(
        self, card: TCardParam, check_group: TCheckGroupParam, as_api: Literal[False]
    ) -> list[tuple[Checkitem, Card | None, User | None]]: ...
    @overload
    async def get_list(
        self, card: TCardParam, check_group: TCheckGroupParam, as_api: Literal[True]
    ) -> list[dict[str, Any]]: ...
    async def get_list(
        self, card: TCardParam, check_group: TCheckGroupParam, as_api: bool
    ) -> list[tuple[Checkitem, Card | None, User | None]] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        check_group = cast(CheckGroup, await self._get_by_param(CheckGroup, check_group))
        if not card or not check_group or check_group.card_id != card.id:
            return []

        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, Card, User)
            .outerjoin(Card, Card.column("id") == Checkitem.column("cardified_id"))
            .outerjoin(User, User.column("id") == Checkitem.column("user_id"))
            .where(Checkitem.column("check_group_id") == check_group.id)
        )
        records = result.all()
        if not as_api:
            return list(records)
        checkitems = []
        for checkitem, cardified_card, user in records:
            api_checkitem = checkitem.api_response()
            api_checkitem["card_uid"] = card.get_uid()
            last_timer = await self.__get_last_timer_record(checkitem)
            if last_timer and last_timer.status == CheckitemStatus.Started:
                api_checkitem["timer_started_at"] = last_timer.created_at
            if cardified_card:
                api_checkitem["cardified_card"] = cardified_card.api_response()
            if user:
                api_checkitem["user"] = user.api_response()
            checkitems.append(api_checkitem)
        return checkitems

    async def create(
        self, user_or_bot: TUserOrBot, card: TCardParam, check_group: TCheckGroupParam, title: str
    ) -> Checkitem | None:
        card = cast(Card, await self._get_by_param(Card, card))
        check_group = cast(CheckGroup, await self._get_by_param(CheckGroup, check_group))
        if not card or not check_group or check_group.card_id != card.id:
            return None

        max_order = await self._get_max_order(Checkitem, "check_group_id", check_group.id)

        checkitem = Checkitem(check_group_id=check_group.id, title=title, order=max_order + 1)
        self._db.insert(checkitem)
        await self._db.commit()

        model = {"checkitem": checkitem.api_response()}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:created:{check_group.get_uid()}",
            data_keys="checkitem",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return checkitem

    async def change_title(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
        title: str,
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checkitem)
        if not params:
            return None
        card, checkitem = params

        checkitem.title = title
        cardified_card = None
        if checkitem.cardified_id:
            cardified_card = await self._get_by(Card, "id", checkitem.cardified_id)
            if not cardified_card:
                checkitem.cardified_id = None
            else:
                cardified_card.title = title
                await self._db.update(cardified_card)

        await self._db.update(checkitem)
        await self._db.commit()

        model = {"title": title}
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=card.get_uid(),
                event=f"{_SOCKET_PREFIX}:title:changed:{checkitem.get_uid()}",
                data_keys="title",
            )
        ]

        if cardified_card:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=cardified_card.project_id.to_short_code(),
                    event=f"board:card:details:changed:{cardified_card.get_uid()}",
                    data_keys="title",
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

        return True

    async def change_order(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
        order: int,
        check_group_uid: str = "",
    ) -> bool | None:
        card = cast(Card, await self._get_by_param(Card, card))
        checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
        if not card or not checkitem:
            return None

        original_order = checkitem.order
        original_check_group = None
        new_check_group = None
        if check_group_uid:
            original_check_group = await self._get_by_param(CheckGroup, checkitem.check_group_id)
            new_check_group = await self._get_by_param(CheckGroup, check_group_uid)
            if (
                not original_check_group
                or not new_check_group
                or original_check_group.card_id != card.id
                or new_check_group.card_id != card.id
            ):
                return None

        shared_update_query = self._db.query("update").table(Checkitem)
        if original_check_group and new_check_group:
            update_query = shared_update_query.values({Checkitem.order: Checkitem.order - 1}).where(
                (Checkitem.column("order") >= original_order)
                & (Checkitem.column("check_group_id") == original_check_group.id)
            )
            await self._db.exec(update_query)

            update_query = shared_update_query.values({Checkitem.order: Checkitem.order + 1}).where(
                (Checkitem.column("order") >= order) & (Checkitem.column("check_group_id") == new_check_group.id)
            )
            await self._db.exec(update_query)
            checkitem.check_group_id = new_check_group.id
        else:
            shared_update_query = shared_update_query.where(
                Checkitem.column("check_group_id") == checkitem.check_group_id
            )
            if original_order < order:
                update_query = shared_update_query.values(
                    {Checkitem.column("order"): Checkitem.column("order") - 1}
                ).where((Checkitem.column("order") <= order) & (Checkitem.column("order") > original_order))
            else:
                update_query = shared_update_query.values(
                    {Checkitem.column("order"): Checkitem.column("order") + 1}
                ).where((Checkitem.column("order") >= order) & (Checkitem.column("order") < original_order))
            await self._db.exec(update_query)
        await self._db.commit()

        checkitem.order = order
        await self._db.update(checkitem)
        await self._db.commit()

        model = {"uid": checkitem.get_uid(), "order": order}
        publish_models: list[SocketPublishModel] = []
        topic_id = card.get_uid()

        if original_check_group and new_check_group:
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=topic_id,
                        event=f"{_SOCKET_PREFIX}:order:changed:{new_check_group.get_uid()}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "to_column", "column_uid": new_check_group.get_uid()},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=topic_id,
                        event=f"{_SOCKET_PREFIX}:order:changed:{original_check_group.get_uid()}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "from_column", "column_uid": original_check_group.get_uid()},
                    ),
                ]
            )
        else:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardCard,
                    topic_id=topic_id,
                    event=f"{_SOCKET_PREFIX}:order:changed:{checkitem.check_group_id.to_short_code()}",
                    data_keys=["uid", "order"],
                    custom_data={"move_type": "in_column"},
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

        return True

    async def change_status(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
        status: CheckitemStatus,
        current_time: datetime | None = None,
        should_publish: bool = True,
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checkitem)
        if not params:
            return None
        card, checkitem = params
        if checkitem.cardified_id:
            return False

        if checkitem.status == status:
            return True

        if not current_time:
            current_time = now()

        if status != CheckitemStatus.Started:
            if not checkitem.user_id:
                return False

            if checkitem.status == CheckitemStatus.Started:
                last_timer_record = cast(CheckitemTimerRecord, await self.__get_last_timer_record(checkitem))
                accumulated_seconds = calculate_time_diff_in_seconds(current_time, last_timer_record.created_at)
                checkitem.accumulated_seconds += accumulated_seconds
                await self._db.update(checkitem)
        else:
            if not checkitem.user_id:
                checkitem.user_id = user_or_bot.id
            checkitem.is_checked = False
            await self._db.update(checkitem)

        checkitem.status = status
        timer_record = CheckitemTimerRecord(checkitem_id=checkitem.id, status=status, created_at=current_time)
        self._db.insert(timer_record)
        await self._db.commit()

        target_user = None
        if checkitem.user_id:
            target_user = await self._get_by(User, "id", checkitem.user_id)

        if should_publish:
            model = {
                "user": target_user.api_response() if target_user else None,
                "status": status,
                "accumulated_seconds": checkitem.accumulated_seconds,
                "is_checked": checkitem.is_checked,
                "timer_started_at": timer_record.created_at if status == CheckitemStatus.Started else None,
            }
            topic_id = card.get_uid()
            publish_model = SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"{_SOCKET_PREFIX}:status:changed:{checkitem.get_uid()}",
                data_keys=list(model.keys()),
            )

            SocketPublishService.put_dispather(model, publish_model)

        return True

    async def toggle_checked(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checkitem)
        if not params:
            return None
        card, checkitem = params

        checkitem.is_checked = not checkitem.is_checked

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, card, checkitem, CheckitemStatus.Stopped)
        else:
            await self._db.update(checkitem)
            await self._db.commit()

            model = {"is_checked": checkitem.is_checked}
            publish_model = SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=card.get_uid(),
                event=f"{_SOCKET_PREFIX}:checked:changed:{checkitem.get_uid()}",
                data_keys="is_checked",
            )

            SocketPublishService.put_dispather(model, publish_model)

        return True

    async def cardify(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
        column_uid: str | None = None,
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checkitem)
        if not params:
            return None
        card, checkitem = params

        if checkitem.cardified_id or column_uid == card.project_id.to_short_code():
            return False

        if not card.project_column_id and not column_uid:
            return False

        target_column = await self._get_by_param(ProjectColumn, column_uid or cast(int, card.project_column_id))
        if not target_column:
            return False

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, card, checkitem, CheckitemStatus.Stopped)

        max_order = await self._get_max_order(
            Card, "project_id", card.project_id, {"project_column_id": target_column.id}
        )
        new_card = Card(
            project_id=card.project_id,
            project_column_id=target_column.id,
            title=checkitem.title,
            order=max_order + 1,
        )
        self._db.insert(new_card)
        await self._db.commit()

        checkitem.cardified_id = new_card.id
        await self._db.update(checkitem)
        await self._db.commit()

        card_service = self._get_service_by_name("card")
        api_card = await card_service.convert_board_list_api_response(new_card)
        model = {"card": api_card}
        topic_id = card.project_id.to_short_code()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=card.get_uid(),
                event=f"{_SOCKET_PREFIX}:cardified:{checkitem.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"{_SOCKET_PREFIX}:created:{target_column.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:project:card:created{topic_id}",
                custom_data={"column_uid": target_column.get_uid()},
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

        return True

    async def delete(
        self,
        user_or_bot: TUserOrBot,
        card: TCardParam,
        checkitem: TCheckitemParam,
    ) -> bool | None:
        params = await self.__get_records_by_params(card, checkitem)
        if not params:
            return None
        card, checkitem = params

        if checkitem.status != CheckitemStatus.Stopped:
            await self.change_status(user_or_bot, card, checkitem, CheckitemStatus.Stopped)

        await self._db.delete(checkitem)
        await self._db.commit()

        model = {"uid": checkitem.get_uid()}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:deleted:{checkitem.check_group_id.to_short_code()}",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def __get_last_timer_record(self, checkitem: Checkitem):
        result = await self._db.exec(
            self._db.query("select")
            .table(CheckitemTimerRecord)
            .where(CheckitemTimerRecord.column("checkitem_id") == checkitem.id)
            .order_by(CheckitemTimerRecord.column("created_at").desc())
            .group_by(CheckitemTimerRecord.column("id"), CheckitemTimerRecord.column("created_at"))
            .limit(1)
        )
        return result.first()

    async def __get_records_by_params(
        self, card: TCardParam, checkitem: TCheckitemParam
    ) -> tuple[Card, Checkitem] | None:
        card = cast(Card, await self._get_by_param(Card, card))
        checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
        if not card or not checkitem:
            return None

        return card, checkitem
