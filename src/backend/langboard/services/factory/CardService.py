from typing import Any, Literal, TypeVar, cast, overload
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.ai import BotType
from ...core.db import SnowflakeID, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardAssignedUser,
    CardComment,
    CardRelationship,
    Checkitem,
    GlobalCardRelationshipType,
    Project,
    ProjectAssignedUser,
    ProjectColumn,
)
from .CardAttachmentService import CardAttachmentService
from .CheckitemService import CheckitemService
from .ProjectColumnService import ProjectColumnService
from .ProjectService import ProjectService
from .RevertService import RevertService, RevertType
from .Types import TCardParam, TColumnParam, TProjectParam


_TSelectParam = TypeVar("_TSelectParam", bound=Any)
_SOCKET_PREFIX = "board:card"


class CardService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card"

    async def get_by_uid(self, uid: str) -> Card | None:
        return await self._get_by_param(Card, uid)

    async def get_details(self, project: TProjectParam, card: TCardParam) -> dict[str, Any] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        if card.project_column_id:
            column = await self._get_by_param(ProjectColumn, card.project_column_id)
            if not column:
                return None
            column_name = column.name
        else:
            column_name = project.archive_column_name

        api_card = card.api_response()
        api_card["deadline_at"] = card.deadline_at
        api_card["column_name"] = column_name

        project_column_service = self._get_service(ProjectColumnService)
        api_card["project_all_columns"] = await project_column_service.get_list(project)

        checkitem_service = self._get_service(CheckitemService)
        api_card["checkitems"] = await checkitem_service.get_list(card)

        project_service = self._get_service(ProjectService)
        api_card["project_members"] = await project_service.get_assigned_users(card.project_id, as_api=True)

        card_attachment_service = self._get_service(CardAttachmentService)
        api_card["attachments"] = await card_attachment_service.get_board_list(card)

        api_card["members"] = await self.get_assigned_users(card, as_api=True)

        result = await self._db.exec(
            self._db.query("select")
            .tables(CardRelationship, GlobalCardRelationshipType, Card)
            .join(
                GlobalCardRelationshipType,
                CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
            )
            .join(
                Card,
                (CardRelationship.column("card_id_parent") == Card.column("id"))
                | (CardRelationship.column("card_id_child") == Card.column("id")),
            )
            .where(
                (
                    (CardRelationship.column("card_id_parent") == card.id)
                    | (CardRelationship.column("card_id_child") == card.id)
                )
                & (Card.column("id") != card.id)
            )
        )
        raw_relationships = result.all()
        api_card["relationships"] = []
        for relationship, relationship_type, related_card in raw_relationships:
            api_card["relationships"].append(
                {
                    "parent_icon": relationship_type.parent_icon,
                    "parent_name": relationship_type.parent_name,
                    "child_icon": relationship_type.child_icon,
                    "child_name": relationship_type.child_name,
                    "description": relationship_type.description or "",
                    "is_parent": relationship.card_id_parent == card.id,
                    "related_card": related_card.api_response(),
                }
            )
        return api_card

    async def get_board_list(self, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(
                Card,
                func.count(CardComment.column("id")).label("count_comment"),  # type: ignore
            )
            .join(Project, Card.column("project_id") == Project.column("id"))
            .outerjoin(
                CardComment,
                (Card.column("id") == CardComment.column("card_id")) & (CardComment.column("deleted_at") == None),  # noqa
            )
            .where(Project.column("id") == project.id)
            .order_by(Card.column("order").asc())
            .group_by(Card.column("id"), Card.column("order"))
        )
        raw_cards = result.all()
        cards = []
        for card, count_comment in raw_cards:
            card_api = await self.convert_board_list_api_response(card, count_comment)
            cards.append(card_api)

        return cards

    @overload
    async def get_assigned_users(
        self, card: TCardParam, as_api: Literal[False]
    ) -> list[tuple[User, CardAssignedUser]]: ...
    @overload
    async def get_assigned_users(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_assigned_users(
        self, card: TCardParam, as_api: bool
    ) -> list[tuple[User, CardAssignedUser]] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(User, CardAssignedUser)
            .join(CardAssignedUser, User.column("id") == CardAssignedUser.column("user_id"))
            .where(CardAssignedUser.column("id") == card.id)
        )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def convert_board_list_api_response(self, card: Card, count_comment: int | None = None) -> dict[str, Any]:
        if count_comment is None:
            sql_query = (
                self._db.query("select").count(CardComment, "id").where(CardComment.column("card_id") == card.id)
            )

            result = await self._db.exec(sql_query)
            count_comment = result.one()

        sql_query = (
            self._db.query("select")
            .table(CardRelationship)
            .join(
                GlobalCardRelationshipType,
                CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
            )
            .where(
                (CardRelationship.column("card_id_parent") == card.id)
                | (CardRelationship.column("card_id_child") == card.id)
            )
        )

        result = await self._db.exec(sql_query)
        raw_relationship = result.all()

        parents = []
        children = []
        for relationship in raw_relationship:
            if relationship.card_id_parent == card.id:
                children.append(relationship.card_id_child)
            else:
                parents.append(relationship.card_id_parent)

        card_api = card.api_response()
        card_api["count_comment"] = count_comment
        card_api["members"] = await self.get_assigned_users(card, as_api=True)
        card_api["relationships"] = {
            "parents": parents,
            "children": children,
        }
        return card_api

    async def create(
        self, user_or_bot: User | BotType, project: TProjectParam, column: TColumnParam, title: str
    ) -> SocketModelIdBaseResult[tuple[Card, dict[str, Any]]] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project or column == Project.ARCHIVE_COLUMN_UID:
            return None

        column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
        if not column or column.project_id != project.id:
            return None

        max_order = await self._get_max_order(Card, "project_id", project.id, {"project_column_id": column.id})

        card = Card(
            project_id=project.id,
            project_column_id=column.id,
            title=title,
            order=max_order + 1,
        )
        self._db.insert(card)
        await self._db.commit()

        model = await self.convert_board_list_api_response(card)
        model_id = await SocketModelIdService.create_model_id({"card": model})

        publish_models: list[SocketPublishModel] = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=project.get_uid(),
                event=f"{_SOCKET_PREFIX}:created:{column.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Project,
                topic_id=project.get_uid(),
                event=f"dashboard:card:created{project.get_uid()}",
                custom_data={"column_uid": column.get_uid()},
            ),
        ]

        return SocketModelIdBaseResult(model_id, (card, model), publish_models)

    async def update(
        self, user_or_bot: User | BotType, project: TProjectParam, card: TCardParam, form: dict
    ) -> SocketModelIdBaseResult[tuple[str | None, dict[str, Any]]] | Literal[True] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        old_card_record = {}
        mutable_keys = ["title", "deadline_at", "description"]

        for key in mutable_keys:
            if key not in form or not hasattr(card, key):
                continue
            old_value = getattr(card, key)
            new_value = form[key]
            if old_value == new_value:
                continue
            old_card_record[key] = self._convert_to_python(old_value)
            setattr(card, key, new_value)

        if not old_card_record:
            return True

        checkitem_cardified_from = None
        if form.get("title", None):
            checkitem_cardified_from = await self._get_by(Checkitem, "cardified_id", card.id)
            if checkitem_cardified_from:
                checkitem_cardified_from.title = card.title
                await self._db.update(checkitem_cardified_from)

        if isinstance(user_or_bot, BotType):
            await self._db.update(card)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(card, RevertType.Update))

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_card_record:
                continue
            model[key] = self._convert_to_python(getattr(card, key))
        model_id = await SocketModelIdService.create_model_id(model)

        publish_models: list[SocketPublishModel] = []
        for key in model:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"{_SOCKET_PREFIX}:{key}:changed:{card.get_uid()}",
                    data_keys=key,
                )
            )
            if key == "title" and checkitem_cardified_from:
                publish_models.append(
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project.get_uid(),
                        event=f"{_SOCKET_PREFIX}:checkitem:title:changed:{checkitem_cardified_from.get_uid()}",
                        data_keys="title",
                    )
                )

        return SocketModelIdBaseResult(model_id, (revert_key, model), publish_models)

    async def change_order(
        self, user: User, project: TProjectParam, card: TCardParam, order: int, column_uid: str = ""
    ) -> SocketModelIdBaseResult[tuple[Card, ProjectColumn | None, ProjectColumn | None]] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        original_column = None
        if card.project_column_id:
            original_column = await self._get_by_param(ProjectColumn, card.project_column_id)
            if not original_column or original_column.project_id != project.id:
                return None

        original_column_id = original_column.id if original_column else Project.ARCHIVE_COLUMN_UID
        # original_column_name = original_column.name if original_column else project.archive_column_name
        new_column = None
        new_column_id = SnowflakeID.from_short_code(column_uid)
        if column_uid:
            if column_uid != Project.ARCHIVE_COLUMN_UID:
                new_column = await self._get_by_param(ProjectColumn, column_uid)
                if not new_column or new_column.project_id != card.project_id:
                    return None

                card.archived_at = None
                card.project_column_id = new_column_id
            else:
                card.archived_at = now()
                card.project_column_id = None

        original_order = card.order

        shared_update_query = (
            self._db.query("update")
            .table(Card)
            .where((Card.column("id") != card.id) & (Card.column("project_id") == card.project_id))
        )
        if column_uid:
            update_query = self.__filter_column(
                shared_update_query.values({Card.order: Card.order - 1}).where(Card.column("order") >= original_order),
                original_column_id,
            )
            await self._db.exec(update_query)

            update_query = self.__filter_column(
                (shared_update_query.values({Card.order: Card.order + 1}).where(Card.column("order") >= order)),
                new_column_id,
            )
            await self._db.exec(update_query)
        else:
            update_query = shared_update_query

            if original_order < order:
                update_query = update_query.values({Card.order: Card.order - 1}).where(
                    (Card.column("order") <= order) & (Card.column("order") > original_order)
                )
            else:
                update_query = update_query.values({Card.order: Card.order + 1}).where(
                    (Card.column("order") >= order) & (Card.column("order") < original_order)
                )

            update_query = self.__filter_column(update_query, original_column_id)
            await self._db.exec(update_query)

        card.order = order
        await self._db.update(card)
        await self._db.commit()

        model = {
            "uid": card.get_uid(),
            "order": card.order,
        }
        if new_column:
            model["to_column_uid"] = new_column.get_uid()
            model["column_name"] = new_column.name
        model_id = await SocketModelIdService.create_model_id(model)

        publish_models: list[SocketPublishModel] = []
        if new_column:
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project.get_uid(),
                        event=f"{_SOCKET_PREFIX}:order:changed:{new_column.get_uid()}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "to_column"},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project.get_uid(),
                        event=f"{_SOCKET_PREFIX}:order:changed:{original_column_id}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "from_column"},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project.get_uid(),
                        event=f"{_SOCKET_PREFIX}:order:changed:{card.get_uid()}",
                        data_keys=["to_column_uid", "column_name"],
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Project,
                        topic_id=project.get_uid(),
                        event="dashboard:card:order:changed",
                        custom_data={
                            "from_column_uid": original_column_id,
                            "to_column_uid": new_column.get_uid(),
                        },
                    ),
                ]
            )
        else:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=project.get_uid(),
                    event=f"{_SOCKET_PREFIX}:order:changed:{original_column_id}",
                    data_keys=["uid", "order"],
                    custom_data={"move_type": "in_column"},
                )
            )

        return SocketModelIdBaseResult(model_id, (card, original_column, new_column), publish_models)

    async def update_assigned_users(
        self,
        user_or_bot: User | BotType,
        project: TProjectParam,
        card: TCardParam,
        assign_user_uids: list[str] | None = None,
    ) -> SocketModelIdBaseResult[list[User]] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        # result = await self._db.exec(
        #     self._db.query("select").column(CardAssignedUser.user_id).where(CardAssignedUser.card_id == card.id)
        # )
        # original_assigned_user_ids = list(result.all())

        await self._db.exec(
            self._db.query("delete").table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id)
        )

        if assign_user_uids:
            assigned_user_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_uids]
            result = await self._db.exec(
                self._db.query("select")
                .table(User)
                .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.column("user_id"))
                .where(
                    (ProjectAssignedUser.column("project_uid") == card.project_id)
                    & (ProjectAssignedUser.column("user_id").in_(assigned_user_ids))
                )
            )
            users = result.all()
            for user in users:
                self._db.insert(CardAssignedUser(card_id=card.id, user_id=user.id))
        else:
            users = []
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id(
            {"assigned_users": [user.api_response() for user in users]}
        )

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:assigned-users:updated:{card.get_uid()}",
            data_keys="assigned_users",
        )

        return SocketModelIdBaseResult(model_id, list(users), publish_model)

    @overload
    def __filter_column(self, query: Select[_TSelectParam], column_id: SnowflakeID | str) -> Select[_TSelectParam]: ...
    @overload
    def __filter_column(
        self, query: SelectOfScalar[_TSelectParam], column_id: SnowflakeID | str
    ) -> SelectOfScalar[_TSelectParam]: ...
    @overload
    def __filter_column(self, query: Update, column_id: SnowflakeID | str) -> Update: ...
    @overload
    def __filter_column(self, query: Delete, column_id: SnowflakeID | str) -> Delete: ...
    def __filter_column(
        self,
        query: Select[_TSelectParam] | SelectOfScalar[_TSelectParam] | Update | Delete,
        column_id: SnowflakeID | str,
    ):
        if column_id == Project.ARCHIVE_COLUMN_UID:
            return query.where(Card.column("archived_at") != None)  # noqa
        return query.where(Card.column("project_column_id") == column_id)

    async def __get_records_by_params(self, project: TProjectParam, card: TCardParam):
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        return project, card
