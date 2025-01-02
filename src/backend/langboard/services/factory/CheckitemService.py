from typing import Any, Literal, cast, overload
from ...core.ai import BotType
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.utils.DateTime import now
from ...models import Card, CardAssignedUser, Checkitem, CheckitemAssignedUser, CheckitemTimer, Project, ProjectColumn
from .ProjectService import ProjectService
from .Types import TCardParam, TCheckitemParam, TProjectParam


_SOCKET_PREFIX = "board:card:checkitem"
_SOCKET_PREFIX_SUB = "board:card:sub-checkitem"


class CheckitemService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "checkitem"

    async def get_list(self, card: TCardParam) -> list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(Checkitem)
            .where(
                (Checkitem.column("card_id") == card.id) & (Checkitem.column("checkitem_id") == None)  # noqa
            )
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("id"), Checkitem.column("order"))
        )
        raw_checkitems = result.all()
        checkitems = [await self.convert_api_response(raw_checkitem) for raw_checkitem in raw_checkitems]

        return checkitems

    async def get_sublist(self, checkitem: TCheckitemParam) -> list[dict[str, Any]]:
        checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
        if not checkitem:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(Checkitem)
            .where(Checkitem.column("checkitem_id") == checkitem.id)
            .order_by(Checkitem.column("order"))
            .group_by(Checkitem.column("id"), Checkitem.column("order"))
        )
        raw_checkitems = result.all()
        checkitems = [await self.convert_api_response(raw_checkitem) for raw_checkitem in raw_checkitems]

        return checkitems

    async def convert_api_response(self, checkitem: Checkitem) -> dict[str, Any]:
        checkitem_dict = checkitem.api_response()
        if checkitem.cardified_id:
            cardified_card = await self._get_by(Card, "id", checkitem.cardified_id)
            if not cardified_card:
                checkitem_dict["cardified"] = None
        timer, acc_time_seconds = await self.get_timer(checkitem.id)
        checkitem_dict["assigned_members"] = await self.get_assigned_users(checkitem.id, as_api=True)
        checkitem_dict["timer"] = timer.api_response() if timer else None
        checkitem_dict["acc_time_seconds"] = acc_time_seconds
        if not checkitem.checkitem_id:
            checkitem_dict["sub_checkitems"] = await self.get_sublist(checkitem.id)
        return checkitem_dict

    # TODO: Timer, will be changed
    @overload
    async def get_timer(self, checkitem: TCheckitemParam) -> tuple[CheckitemTimer | None, int]: ...
    @overload
    async def get_timer(
        self, checkitem: TCheckitemParam, timer_only: Literal[False]
    ) -> tuple[CheckitemTimer | None, int]: ...
    @overload
    async def get_timer(self, checkitem: TCheckitemParam, timer_only: Literal[True]) -> CheckitemTimer | None: ...
    async def get_timer(
        self, checkitem: TCheckitemParam, timer_only: bool = False
    ) -> tuple[CheckitemTimer | None, int] | CheckitemTimer | None:
        checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
        if not checkitem:
            return None
        query = (
            self._db.query("select").table(CheckitemTimer).where(CheckitemTimer.column("checkitem_id") == checkitem.id)
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
    async def get_assigned_users(
        self, checkitem: TCheckitemParam, as_api: Literal[False]
    ) -> list[tuple[User, CheckitemAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, checkitem: TCheckitemParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, checkitem: TCheckitemParam, as_api: bool
    ) -> list[tuple[User, CheckitemAssignedUser]] | list[dict[str, Any]]:
        checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
        if not checkitem:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(User, CheckitemAssignedUser)
            .join(CheckitemAssignedUser, CheckitemAssignedUser.column("user_id") == User.column("id"))
            .where(CheckitemAssignedUser.column("checkitem_id") == checkitem.id)
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def create(
        self,
        user_or_bot: User | BotType,
        project: TProjectParam,
        card: TCardParam,
        title: str,
        parent_checkitem_uid: str | None = None,
        assign_user_uids: list[str] | None = None,
    ) -> SocketModelIdBaseResult[tuple[Checkitem, dict[str, Any]]] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card, _ = params

        max_order_where_clauses = None
        parent_checkitem = None
        if parent_checkitem_uid is not None:
            parent_checkitem = await self._get_by_param(Checkitem, parent_checkitem_uid)
            if parent_checkitem is None:
                return None
            max_order_where_clauses = {"checkitem_id": SnowflakeID.from_short_code(parent_checkitem_uid)}

        max_order = await self._get_max_order(Checkitem, "card_id", card.id, max_order_where_clauses)

        checkitem = Checkitem(
            card_id=card.id,
            checkitem_id=parent_checkitem.id if parent_checkitem else None,
            title=title,
            order=max_order + 1,
        )
        self._db.insert(checkitem)
        await self._db.commit()

        if parent_checkitem:
            existed_assign_users = await self.get_assigned_users(parent_checkitem.id, as_api=False)
            for user, _ in existed_assign_users:
                checkitem_assigned_user = CheckitemAssignedUser(checkitem_id=checkitem.id, user_id=user.id)
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        if assign_user_uids:
            for assign_user_uid in assign_user_uids:
                checkitem_assigned_user = CheckitemAssignedUser(
                    checkitem_id=checkitem.id, user_id=SnowflakeID.from_short_code(assign_user_uid)
                )
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        api_checkitem = await self.convert_api_response(checkitem)
        model_id = await SocketModelIdService.create_model_id({"checkitem": api_checkitem})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=(
                f"{_SOCKET_PREFIX}:created:{card.get_uid()}"
                if not parent_checkitem_uid
                else f"{_SOCKET_PREFIX_SUB}:created:{parent_checkitem_uid}"
            ),
            data_keys="checkitem",
        )

        return SocketModelIdBaseResult(model_id, (checkitem, api_checkitem), publish_model)

    async def change_title(
        self,
        user_or_bot: User | BotType,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        title: str,
    ) -> SocketModelIdBaseResult[tuple[Checkitem, Card | None]] | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        # original_title = checkitem.title
        checkitem.title = title

        cardified_card = None
        if checkitem.cardified_id:
            cardified_card = await self._get_by(Card, "id", checkitem.cardified_id)
            if cardified_card:
                cardified_card.title = title
                await self._db.update(cardified_card)

        await self._db.update(checkitem)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id({"title": title})

        publish_models: list[SocketPublishModel] = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=project.get_uid(),
                event=f"{_SOCKET_PREFIX}:title:changed:{checkitem.get_uid()}",
                data_keys="title",
            )
        ]
        if cardified_card:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"board:card:details:changed:{cardified_card.get_uid()}",
                    data_keys="title",
                )
            )

        return SocketModelIdBaseResult(model_id, (checkitem, cardified_card), publish_models)

    async def change_order(
        self,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        order: int,
        parent_checkitem_uid: str = "",
    ) -> SocketModelIdBaseResult[tuple[Checkitem, SnowflakeID | None, Checkitem | None]] | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        original_parent_id = checkitem.checkitem_id
        original_order = checkitem.order

        is_sub = original_parent_id is not None
        shared_update_query = self._db.query("update").table(Checkitem).where(Checkitem.column("card_id") == card.id)

        parent_checkitem = None
        if is_sub:
            parent_checkitem_id = SnowflakeID.from_short_code(parent_checkitem_uid)
            if not parent_checkitem_uid or parent_checkitem_id == original_parent_id:
                shared_update_query = shared_update_query.where(Checkitem.column("checkitem_id") == original_parent_id)
                parent_checkitem_uid = ""
            else:
                parent_checkitem = await self._get_by(Checkitem, "id", parent_checkitem_id)
                if parent_checkitem is None:
                    return None
        else:
            shared_update_query = shared_update_query.where(Checkitem.column("checkitem_id") == None)  # noqa

        if parent_checkitem:
            update_query = shared_update_query.values({Checkitem.order: Checkitem.order - 1}).where(
                (Checkitem.column("order") >= original_order) & (Checkitem.column("checkitem_id") == original_parent_id)
            )
            await self._db.exec(update_query)

            update_query = shared_update_query.values({Checkitem.order: Checkitem.order + 1}).where(
                (Checkitem.column("order") >= order) & (Checkitem.column("checkitem_id") == parent_checkitem.id)
            )
            await self._db.exec(update_query)
            checkitem.checkitem_id = parent_checkitem.id
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

        model_id = await SocketModelIdService.create_model_id({"uid": checkitem.get_uid(), "order": order})

        publish_models: list[SocketPublishModel] = []
        if not is_sub:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"{_SOCKET_PREFIX}:order:changed:{card.get_uid()}",
                    data_keys=["uid", "order"],
                )
            )
        else:
            if original_parent_id and parent_checkitem and original_parent_id != parent_checkitem.id:
                publish_models.extend(
                    [
                        SocketPublishModel(
                            topic=SocketTopic.Board,
                            topic_id=project.get_uid(),
                            event=f"{_SOCKET_PREFIX_SUB}:order:changed:{parent_checkitem.get_uid()}",
                            data_keys=["uid", "order"],
                            custom_data={"move_type": "to_column", "column_uid": parent_checkitem.get_uid()},
                        ),
                        SocketPublishModel(
                            topic=SocketTopic.Board,
                            topic_id=project.get_uid(),
                            event=f"{_SOCKET_PREFIX_SUB}:order:changed:{original_parent_id.to_short_code()}",
                            data_keys=["uid", "order"],
                            custom_data={"move_type": "from_column", "column_uid": original_parent_id.to_short_code()},
                        ),
                    ]
                )
            else:
                publish_models.append(
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project.get_uid(),
                        event=f"{_SOCKET_PREFIX_SUB}:order:changed:{original_parent_id.to_short_code()}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "in_column"},
                    )
                )

        return SocketModelIdBaseResult(model_id, (checkitem, original_parent_id, parent_checkitem), publish_models)

    async def cardify(
        self,
        user_or_bot: User | BotType,
        project: TProjectParam,
        card: TCardParam,
        checkitem: TCheckitemParam,
        column_uid: str | None = None,
        with_sub_checkitems: bool = False,
        with_assign_users: bool = False,
    ) -> SocketModelIdBaseResult[Card] | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params
        if checkitem.cardified_id or column_uid == project.ARCHIVE_COLUMN_UID() or card.archived_at:
            return None

        if column_uid:
            column = await self._get_by_param(ProjectColumn, column_uid)
            if not column:
                return None
            column_id = column.id
        else:
            column_id = card.project_column_id
            if not column_id:
                return None

        max_order = await self._get_max_order(Card, "project_id", card.project_id, {"project_column_id": column_id})

        new_card = Card(
            project_id=card.project_id,
            project_column_id=column_id,
            title=checkitem.title,
            order=max_order + 1,
        )
        self._db.insert(new_card)
        await self._db.commit()

        if not checkitem.checkitem_id and with_sub_checkitems:
            sub_checkitems = await self._get_all_by(Checkitem, "checkitem_id", checkitem.id)
            for sub_checkitem in sub_checkitems:
                new_sub_checkitem = Checkitem(
                    card_id=new_card.id,
                    title=sub_checkitem.title,
                    order=sub_checkitem.order,
                )
                self._db.insert(new_sub_checkitem)
                await self._db.commit()

                if with_assign_users:
                    existed_assign_users = await self.get_assigned_users(sub_checkitem.id, as_api=False)
                    for user, _ in existed_assign_users:
                        checkitem_assigned_user = CheckitemAssignedUser(
                            checkitem_id=new_sub_checkitem.id, user_id=user.id
                        )
                        self._db.insert(checkitem_assigned_user)
                    await self._db.commit()

        if with_assign_users:
            existed_assign_users = await self.get_assigned_users(checkitem.id, as_api=False)
            for user, _ in existed_assign_users:
                checkitem_assigned_user = CardAssignedUser(card_id=new_card.id, user_id=user.id)
                self._db.insert(checkitem_assigned_user)
            await self._db.commit()

        checkitem.cardified_id = new_card.id
        await self._db.update(checkitem)
        await self._db.commit()

        card_service = self._get_service_by_name("card")
        api_card = await card_service.convert_board_list_api_response(new_card)
        model_id = await SocketModelIdService.create_model_id({"card": api_card})

        publish_models: list[SocketPublishModel] = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=project.get_uid(),
                event=f"{_SOCKET_PREFIX}:cardified:{checkitem.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=project.get_uid(),
                event=f"board:card:created:{column_id.to_short_code()}",
                data_keys="card",
            ),
        ]

        project_service = self._get_service(ProjectService)
        publish_models.extend(
            await project_service.create_publish_private_models_for_members(
                project=project,
                topic=SocketTopic.Dashboard,
                event=f"dashboard:project:card:created{project.get_uid()}",
                custom_data={"column_uid": column.get_uid()},
            )
        )

        return SocketModelIdBaseResult(model_id, new_card, publish_models)

    async def delete(
        self, user_or_bot: User | BotType, project: TProjectParam, card: TCardParam, checkitem: TCheckitemParam
    ) -> SocketModelIdBaseResult[Checkitem] | None:
        params = await self.__get_records_by_params(project, card, checkitem)
        if not params:
            return None
        project, card, checkitem = params

        timer, acc_time_seconds = await self.get_timer(checkitem.id)
        if timer:
            acc_time_seconds += int(
                (now().replace(tzinfo=None) - timer.started_at.replace(tzinfo=None)).total_seconds()
            )

        if not checkitem.checkitem_id:
            sub_checkitems = await self._get_all_by(Checkitem, "checkitem_id", checkitem.id)
            # count_sub_checkitems = len(sub_checkitems)
            for sub_checkitem in sub_checkitems:
                await self.__delete(sub_checkitem)
        # else:
        #     count_sub_checkitems = None

        await self.__delete(checkitem)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id({"uid": checkitem.get_uid()})

        parent_id = checkitem.checkitem_id if checkitem.checkitem_id else checkitem.card_id
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:deleted:{parent_id.to_short_code()}",
            data_keys="uid",
        )

        return SocketModelIdBaseResult(model_id, checkitem, publish_model)

    # TODO: Timer, will be changed
    async def start_timer(self, user: User, card_uid: str, checkitem_uid: str) -> CheckitemTimer | None:
        card_id = SnowflakeID.from_short_code(card_uid)
        checkitem_id = SnowflakeID.from_short_code(checkitem_uid)
        result = await self._db.exec(
            self._db.query("select")
            .tables(Checkitem, Card, CheckitemTimer)
            .join(Card, Checkitem.column("card_id") == Card.column("id"))
            .outerjoin(
                CheckitemTimer,
                (CheckitemTimer.column("checkitem_id") == Checkitem.column("id"))
                & (CheckitemTimer.column("stopped_at") == None),  # noqa
            )
            .where((Checkitem.column("id") == checkitem_id) & (Card.column("id") == card_id))
        )
        checkitem, card, existed_timer = result.first() or (None, None, None)
        if existed_timer or not checkitem or not card:
            return None

        timer = CheckitemTimer(checkitem_id=checkitem_id)
        self._db.insert(timer)
        await self._db.commit()

        return timer

    # TODO: Timer, will be changed
    async def stop_timer(self, user: User, card_uid: str, checkitem_uid: str) -> CheckitemTimer | None:
        card_id = SnowflakeID.from_short_code(card_uid)
        checkitem_id = SnowflakeID.from_short_code(checkitem_uid)
        result = await self._db.exec(
            self._db.query("select")
            .tables(CheckitemTimer, Checkitem, Card)
            .join(Checkitem, CheckitemTimer.column("checkitem_id") == Checkitem.column("id"))
            .join(Card, Checkitem.column("card_id") == Card.column("id"))
            .where(
                (Checkitem.column("id") == checkitem_id)
                & (Card.column("id") == card_id)
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

    # TODO: Timer, will be changed
    async def __delete(self, checkitem: Checkitem):
        result = await self._db.exec(
            self._db.query("select")
            .table(CheckitemTimer)
            .where(
                (CheckitemTimer.column("checkitem_id") == checkitem.id) & (CheckitemTimer.column("stopped_at") == None)  # noqa
            )
        )
        running_timer = result.first()
        if running_timer:
            running_timer.stopped_at = now()
            await self._db.update(running_timer)

        await self._db.delete(checkitem)

    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam
    ) -> tuple[Project, Card, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, checkitem: TCheckitemParam
    ) -> tuple[Project, Card, Checkitem] | None: ...
    async def __get_records_by_params(  # type: ignore
        self, project: TProjectParam, card: TCardParam, checkitem: TCheckitemParam | None = None
    ):
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not card or not project or card.project_id != project.id:
            return None

        if checkitem:
            checkitem = cast(Checkitem, await self._get_by_param(Checkitem, checkitem))
            if not checkitem or checkitem.card_id != card.id:
                return None
        else:
            checkitem = None

        return project, card, checkitem
