from typing import Any, cast
from ...models import Card, CardActivity, Checkitem, CheckitemTimer, User
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService


class CheckitemService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checkitem"

    async def get_list(self, card_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, User)
            .join(User, Checkitem.column("user_id") == User.column("id"))
            .where((Checkitem.column("card_uid") == card_uid) & (Checkitem.column("checkitem_uid") == None))  # noqa
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("order"))
        )
        raw_checkitems = result.all()

        checkitems = []
        for raw_checkitem, user in raw_checkitems:
            checkitem = raw_checkitem.api_response()
            timer, acc_time = await self.get_timer(raw_checkitem.uid)
            checkitem["user"] = user.api_response()
            checkitem["timer"] = timer.api_response() if timer else None
            checkitem["acc_time"] = acc_time
            checkitem["sub_checkitems"] = await self.get_sublist(raw_checkitem.uid)
            checkitems.append(checkitem)

        return checkitems

    async def get_sublist(self, checkitem_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, User)
            .join(User, Checkitem.column("user_id") == User.column("id"))
            .where(Checkitem.column("checkitem_uid") == checkitem_uid)
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("order"))
        )
        raw_checkitems = result.all()

        checkitems = []
        for raw_checkitem, user in raw_checkitems:
            checkitem = raw_checkitem.api_response()
            timer, acc_time = await self.get_timer(raw_checkitem.uid)
            checkitem["user"] = user.api_response()
            checkitem["timer"] = timer.api_response() if timer else None
            checkitem["acc_time"] = acc_time
            checkitems.append(checkitem)

        return checkitems

    async def get_timer(self, checkitem_uid: str) -> tuple[CheckitemTimer | None, int]:
        result = await self._db.exec(
            self._db.query("select")
            .table(CheckitemTimer)
            .where(CheckitemTimer.column("checkitem_uid") == checkitem_uid)
            .order_by(CheckitemTimer.column("started_at").desc())
            .group_by(CheckitemTimer.column("started_at"))
        )
        raw_timers = result.all()

        timer = None
        acc_time = 0
        for raw_timer in raw_timers:
            if raw_timer.ended_at is None:
                timer = raw_timer
                continue
            acc_time += int((raw_timer.ended_at - raw_timer.started_at).total_seconds())

        return timer, acc_time

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardCheckitemCreated)
    async def create(
        self, user: User, card_uid: str, target_user_id: int | None, title: str, parent_checkitem_uid: str | None = None
    ) -> tuple[ActivityResult, Checkitem] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if card is None:
            return None

        if parent_checkitem_uid is not None:
            parent_checkitem = await self._get_by(Checkitem, "uid", parent_checkitem_uid)
            if parent_checkitem is None:
                return None

        if target_user_id is None:
            target_user_id = cast(int, user.id)

        checkitem = Checkitem(
            user_id=target_user_id,
            card_uid=card_uid,
            checkitem_uid=parent_checkitem_uid,
            title=title,
        )
        self._db.insert(checkitem)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=checkitem,
            shared={
                "project_id": card.project_id,
                "parent_checkitem_id": parent_checkitem.id if parent_checkitem_uid else None,
                "target_user_id": target_user_id if target_user_id != user.id else None,
            },
            new={"title": title, "card_uid": card_uid, "user_id": target_user_id},
        )

        return activity_result, checkitem
