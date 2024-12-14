from typing import Any, Literal, cast, overload
from ...core.ai import BotType
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardAssignedUser,
    Checkitem,
    CheckitemAssignedUser,
    CheckitemTimer,
    Project,
    ProjectColumn,
    User,
)


class CheckitemService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checkitem"

    async def get_list(self, card_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(Checkitem)
            .where((Checkitem.column("card_uid") == card_uid) & (Checkitem.column("checkitem_uid") == None))  # noqa
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("order"))
        )
        raw_checkitems = result.all()

        checkitems = []
        for raw_checkitem in raw_checkitems:
            checkitems.append(await self.convert_api_response(raw_checkitem))

        return checkitems

    async def get_sublist(self, checkitem_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .table(Checkitem)
            .where(Checkitem.column("checkitem_uid") == checkitem_uid)
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("order"))
        )
        raw_checkitems = result.all()

        checkitems = []
        for raw_checkitem in raw_checkitems:
            checkitems.append(await self.convert_api_response(raw_checkitem))

        return checkitems

    async def convert_api_response(self, checkitem: Checkitem) -> dict[str, Any]:
        checkitem_dict = checkitem.api_response()
        if checkitem.cardified_uid:
            cardified_card = await self._get_by(Card, "uid", checkitem.cardified_uid)
            if not cardified_card:
                checkitem_dict["cardified"] = None
        timer, acc_time_seconds = await self.get_timer(checkitem.uid)
        checkitem_dict["assigned_members"] = await self.get_assigned_users(cast(int, checkitem.id), True)
        checkitem_dict["timer"] = timer.api_response() if timer else None
        checkitem_dict["acc_time_seconds"] = acc_time_seconds
        if not checkitem.checkitem_uid:
            checkitem_dict["sub_checkitems"] = await self.get_sublist(checkitem.uid)
        return checkitem_dict

    @overload
    async def get_timer(self, checkitem_uid: str) -> tuple[CheckitemTimer | None, int]: ...
    @overload
    async def get_timer(self, checkitem_uid: str, timer_only: Literal[False]) -> tuple[CheckitemTimer | None, int]: ...
    @overload
    async def get_timer(self, checkitem_uid: str, timer_only: Literal[True]) -> CheckitemTimer | None: ...
    async def get_timer(
        self, checkitem_uid: str, timer_only: bool = False
    ) -> tuple[CheckitemTimer | None, int] | CheckitemTimer | None:
        query = (
            self._db.query("select")
            .table(CheckitemTimer)
            .where(CheckitemTimer.column("checkitem_uid") == checkitem_uid)
        )

        if timer_only:
            result = await self._db.exec(query.where(CheckitemTimer.column("stopped_at") == None))  # noqa
            return result.first()

        result = await self._db.exec(
            query.order_by(CheckitemTimer.column("started_at").desc()).group_by(CheckitemTimer.column("started_at"))
        )
        raw_timers = result.all()

        timer = None
        acc_time_seconds = 0
        for raw_timer in raw_timers:
            if raw_timer.stopped_at is None:
                timer = raw_timer
                continue
            acc_time_seconds += int((raw_timer.stopped_at - raw_timer.started_at).total_seconds())

        return timer, acc_time_seconds

    @overload
    async def get_assigned_users(self, checkitem_id: int) -> list[User]: ...
    @overload
    async def get_assigned_users(self, checkitem_id: int, is_api: Literal[False]) -> list[User]: ...
    @overload
    async def get_assigned_users(self, checkitem_id: int, is_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(self, checkitem_id: int, is_api: bool = False) -> list[User | dict[str, Any]]:  # type: ignore
        result = await self._db.exec(
            self._db.query("select")
            .tables(CheckitemAssignedUser, User)
            .join(User, CheckitemAssignedUser.column("user_id") == User.column("id"))
            .where(CheckitemAssignedUser.column("checkitem_id") == checkitem_id)
        )
        raw_users = result.all()
        return [user if not is_api else user.api_response() for _, user in raw_users]

    async def create(
        self,
        user_or_bot: User | BotType,
        card_uid: str,
        title: str,
        parent_checkitem_uid: str | None = None,
        assign_user_ids: list[int] | None = None,
    ) -> ModelIdBaseResult[tuple[Checkitem, dict[str, Any]]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if card is None:
            return None

        max_order_where_clauses = None
        if parent_checkitem_uid is not None:
            parent_checkitem = await self._get_by(Checkitem, "uid", parent_checkitem_uid)
            if parent_checkitem is None:
                return None
            max_order_where_clauses = {"checkitem_uid": parent_checkitem_uid}

        max_order = await self._get_max_order(Checkitem, "card_uid", card_uid, max_order_where_clauses)

        checkitem = Checkitem(
            card_uid=card_uid,
            checkitem_uid=parent_checkitem_uid,
            title=title,
            order=max_order + 1,
        )
        self._db.insert(checkitem)
        await self._db.commit()

        if parent_checkitem_uid:
            existed_assign_users = await self.get_assigned_users(cast(int, parent_checkitem.id))
            for user in existed_assign_users:
                checkitem_assigned_user = CheckitemAssignedUser(
                    checkitem_id=cast(int, checkitem.id), user_id=cast(int, user.id)
                )
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        if assign_user_ids:
            for assign_user_id in assign_user_ids:
                checkitem_assigned_user = CheckitemAssignedUser(
                    checkitem_id=cast(int, checkitem.id), user_id=assign_user_id
                )
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        api_checkitem = await self.convert_api_response(checkitem)
        model_id = await ModelIdService.create_model_id({"checkitem": api_checkitem})

        return ModelIdBaseResult(model_id, (checkitem, api_checkitem))

    async def change_title(
        self, user_or_bot: User | BotType, card_uid: str, checkitem_uid: str, title: str
    ) -> ModelIdBaseResult[tuple[Checkitem, Card | None]] | None:
        checkitem, card = await self.__get_with_card(card_uid, checkitem_uid)
        if not checkitem or not card:
            return None

        # original_title = checkitem.title
        checkitem.title = title

        cardified_card = None
        if checkitem.cardified_uid:
            cardified_card = await self._get_by(Card, "uid", checkitem.cardified_uid)
            if cardified_card:
                cardified_card.title = title
                await self._db.update(cardified_card)

        await self._db.update(checkitem)
        await self._db.commit()

        model = {
            "uid": checkitem_uid,
            "title": title,
        }
        model_id = await ModelIdService.create_model_id(model)
        return ModelIdBaseResult(model_id, (checkitem, cardified_card))

    async def change_order(
        self, card_uid: str, checkitem_uid: str, order: int, parent_checkitem_uid: str = ""
    ) -> ModelIdBaseResult[tuple[Checkitem, str | None, Checkitem | None]] | None:
        checkitem, card = await self.__get_with_card(card_uid, checkitem_uid)
        if not checkitem or not card:
            return None

        original_parent_uid = checkitem.checkitem_uid
        original_order = checkitem.order

        is_sub = original_parent_uid is not None
        shared_update_query = self._db.query("update").table(Checkitem).where(Checkitem.column("card_uid") == card_uid)

        parent_checkitem = None
        if is_sub:
            if not parent_checkitem_uid or parent_checkitem_uid == original_parent_uid:
                shared_update_query = shared_update_query.where(
                    Checkitem.column("checkitem_uid") == original_parent_uid
                )
                parent_checkitem_uid = ""
            else:
                parent_checkitem = await self._get_by(Checkitem, "uid", parent_checkitem_uid)
                if parent_checkitem is None:
                    return None
        else:
            shared_update_query = shared_update_query.where(Checkitem.column("checkitem_uid") == None)  # noqa

        if parent_checkitem_uid:
            update_query = shared_update_query.values({Checkitem.order: Checkitem.order - 1}).where(
                (Checkitem.column("order") >= original_order)
                & (Checkitem.column("checkitem_uid") == original_parent_uid)  # noqa
            )
            await self._db.exec(update_query)

            update_query = shared_update_query.values({Checkitem.order: Checkitem.order + 1}).where(
                (Checkitem.column("order") >= order) & (Checkitem.column("checkitem_uid") == parent_checkitem_uid)  # noqa
            )
            await self._db.exec(update_query)
            checkitem.checkitem_uid = parent_checkitem_uid
        else:
            if original_order < order:
                update_query = shared_update_query.values(
                    {Checkitem.column("order"): Checkitem.column("order") - 1}
                ).where((Checkitem.column("order") <= order) & (Checkitem.column("order") > original_order))
            else:
                update_query = shared_update_query.values(
                    {Checkitem.column("order"): Checkitem.column("order") + 1}
                ).where((Checkitem.column("order") >= order) & (Checkitem.column("order") < original_order))
            await self._db.exec(update_query)

        checkitem.order = order
        await self._db.update(checkitem)
        await self._db.commit()

        model = {
            "uid": checkitem_uid,
            "order": order,
        }
        if is_sub:
            model["from_column_uid"] = original_parent_uid
            if original_parent_uid and parent_checkitem and original_parent_uid != parent_checkitem.uid:
                model["to_column_uid"] = parent_checkitem.uid

        model_id = await ModelIdService.create_model_id(model)
        return ModelIdBaseResult(model_id, (checkitem, original_parent_uid, parent_checkitem))

    async def cardify(
        self,
        user_or_bot: User | BotType,
        card_uid: str,
        checkitem_uid: str,
        column_uid: str | None = None,
        with_sub_checkitems: bool = False,
        with_assign_users: bool = False,
    ) -> ModelIdBaseResult[tuple[Card, dict[str, Any]]] | None:
        checkitem, card = await self.__get_with_card(card_uid, checkitem_uid)
        if (
            not checkitem
            or not card
            or checkitem.cardified_uid
            or column_uid == Project.ARCHIVE_COLUMN_UID
            or card.archived_at
        ):
            return None

        if column_uid:
            column = await self._get_by(ProjectColumn, "uid", column_uid)
            if not column:
                return None
        else:
            column_uid = card.project_column_uid

        max_order = await self._get_max_order(Card, "project_id", card.project_id, {"project_column_uid": column_uid})

        new_card = Card(
            project_id=card.project_id,
            project_column_uid=column_uid,
            title=checkitem.title,
            order=max_order + 1,
        )
        self._db.insert(new_card)
        await self._db.commit()

        if not checkitem.checkitem_uid and with_sub_checkitems:
            sub_checkitems = await self._get_all_by(Checkitem, "checkitem_uid", checkitem_uid)
            for sub_checkitem in sub_checkitems:
                new_sub_checkitem = Checkitem(
                    card_uid=new_card.uid,
                    title=sub_checkitem.title,
                    order=sub_checkitem.order,
                )
                self._db.insert(new_sub_checkitem)
                await self._db.commit()

                if with_assign_users:
                    existed_assign_users = await self.get_assigned_users(cast(int, sub_checkitem.id))
                    for user in existed_assign_users:
                        checkitem_assigned_user = CheckitemAssignedUser(
                            checkitem_id=cast(int, new_sub_checkitem.id), user_id=cast(int, user.id)
                        )
                        self._db.insert(checkitem_assigned_user)
                    await self._db.commit()

        if with_assign_users:
            existed_assign_users = await self.get_assigned_users(cast(int, checkitem.id))
            for user in existed_assign_users:
                checkitem_assigned_user = CardAssignedUser(card_id=cast(int, new_card.id), user_id=cast(int, user.id))
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        checkitem.cardified_uid = new_card.uid
        await self._db.update(checkitem)
        await self._db.commit()

        card_service = self._get_service_by_name("card")
        api_card = await card_service.convert_board_list_api_response(new_card)
        model_id = await ModelIdService.create_model_id(
            {
                "new_card": api_card,
            }
        )
        return ModelIdBaseResult(model_id, (new_card, api_card))

    async def delete(
        self, user_or_bot: User | BotType, card_uid: str, checkitem_uid: str
    ) -> ModelIdBaseResult[Checkitem] | None:
        checkitem, card = await self.__get_with_card(card_uid, checkitem_uid)
        if not checkitem or not card:
            return None

        timer, acc_time_seconds = await self.get_timer(checkitem.uid)
        if timer:
            acc_time_seconds += int(
                (now().replace(tzinfo=None) - timer.started_at.replace(tzinfo=None)).total_seconds()
            )

        if not checkitem.checkitem_uid:
            sub_checkitems = await self._get_all_by(Checkitem, "checkitem_uid", checkitem_uid)
            # count_sub_checkitems = len(sub_checkitems)
            for sub_checkitem in sub_checkitems:
                await self.__delete(sub_checkitem)
        # else:
        #     count_sub_checkitems = None

        await self.__delete(checkitem)
        await self._db.commit()

        model = {
            "uid": checkitem_uid,
        }
        model_id = await ModelIdService.create_model_id(model)

        return ModelIdBaseResult(model_id, checkitem)

    async def start_timer(self, user: User, card_uid: str, checkitem_uid: str) -> CheckitemTimer | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, Card, CheckitemTimer)
            .join(Card, Checkitem.column("card_uid") == Card.column("uid"))
            .outerjoin(
                CheckitemTimer,
                (CheckitemTimer.column("checkitem_uid") == Checkitem.column("uid"))
                & (CheckitemTimer.column("stopped_at") == None),  # noqa
            )
            .where((Checkitem.column("uid") == checkitem_uid) & (Card.column("uid") == card_uid))
        )
        checkitem, card, existed_timer = result.first() or (None, None, None)
        if existed_timer or not checkitem or not card:
            return None

        timer = CheckitemTimer(checkitem_uid=checkitem_uid)
        self._db.insert(timer)
        await self._db.commit()

        return timer

    async def stop_timer(self, user: User, card_uid: str, checkitem_uid: str) -> CheckitemTimer | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CheckitemTimer, Checkitem, Card)
            .join(Checkitem, CheckitemTimer.column("checkitem_uid") == Checkitem.column("uid"))
            .join(Card, Checkitem.column("card_uid") == Card.column("uid"))
            .where(
                (Checkitem.column("uid") == checkitem_uid)
                & (Card.column("uid") == card_uid)
                & (CheckitemTimer.column("stopped_at") == None)  # noqa
            )
        )
        timer, checkitem, card = result.first() or (None, None, None)
        if not timer or not checkitem or not card:
            return None

        timer.stopped_at = now()
        await self._db.update(timer)
        await self._db.commit()

        return timer

    async def __get_with_card(self, card_uid: str, checkitem_uid: str) -> tuple[Checkitem | None, Card | None]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, Card)
            .join(Card, Checkitem.column("card_uid") == Card.column("uid"))
            .where((Checkitem.column("uid") == checkitem_uid) & (Card.column("uid") == card_uid))
        )
        return result.first() or (None, None)

    async def __delete(self, checkitem: Checkitem):
        result = await self._db.exec(
            self._db.query("select")
            .table(CheckitemTimer)
            .where(
                (CheckitemTimer.column("checkitem_uid") == checkitem.uid)
                & (CheckitemTimer.column("stopped_at") == None)  # noqa
            )
        )
        running_timer = result.first()
        if running_timer:
            running_timer.stopped_at = now()
            await self._db.update(running_timer)

        await self._db.delete(checkitem)
