from datetime import datetime
from typing import Any, TypeVar, cast, overload
from pydantic import BaseModel
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.ai import BotType
from ...core.db import EditorContentModel
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
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
    User,
)
from .CardAttachmentService import CardAttachmentService
from .CheckitemService import CheckitemService
from .ProjectService import ProjectService
from .RevertService import RevertService, RevertType


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class CardService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card"

    async def get_by_id(self, card_id: int | None) -> Card | None:
        return await self._get_by(Card, "id", card_id)

    async def get_by_uid(self, card_uid: str | None) -> Card | None:
        return await self._get_by(Card, "uid", card_uid)

    async def get_details(self, card_uid: str) -> dict[str, Any] | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Card, ProjectColumn, Project)
            .join(ProjectColumn, Card.column("project_column_uid") == ProjectColumn.column("uid"))
            .join(Project, Card.column("project_id") == Project.column("id"))
            .where(Card.column("uid") == card_uid)
        )
        card, column, project = result.first() or (None, None, None)
        if not card or not column or not project:
            return None

        api_card = card.api_response()
        api_card["deadline_at"] = card.deadline_at
        api_card["column_name"] = column.name
        api_card["project_all_columns"] = await self._get_service(ProjectService).get_columns(project)

        checkitem_service = self._get_service(CheckitemService)
        api_card["checkitems"] = await checkitem_service.get_list(card.uid)

        project_service = self._get_service(ProjectService)
        api_card["project_members"] = await project_service.get_assigned_users(card.project_id, as_api=True)

        card_attachment_service = self._get_service(CardAttachmentService)
        api_card["attachments"] = await card_attachment_service.get_board_list(card_uid)

        result = await self._db.exec(
            self._db.query("select")
            .table(User)
            .join(CardAssignedUser, User.column("id") == CardAssignedUser.column("user_id"))
            .where(CardAssignedUser.column("card_id") == card.id)
        )
        raw_users = result.all()
        api_card["members"] = [user.api_response() for user in raw_users]

        result = await self._db.exec(
            self._db.query("select")
            .tables(CardRelationship, GlobalCardRelationshipType, Card)
            .join(
                GlobalCardRelationshipType,
                CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
            )
            .join(
                Card,
                (CardRelationship.column("card_uid_parent") == Card.column("uid"))
                | (CardRelationship.column("card_uid_child") == Card.column("uid")),
            )
            .where(
                (
                    (CardRelationship.column("card_uid_parent") == card_uid)
                    | (CardRelationship.column("card_uid_child") == card_uid)
                )
                & (Card.column("uid") != card_uid)
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
                    "is_parent": relationship.card_uid_parent == card_uid,
                    "related_card": related_card.api_response(),
                }
            )
        return api_card

    async def get_board_list(self, project_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(
                Card,
                func.count(CardComment.column("id")).label("count_comment"),  # type: ignore
            )
            .join(Project, Card.column("project_id") == Project.column("id"))
            .outerjoin(
                CardComment,
                (Card.column("uid") == CardComment.column("card_uid")) & (CardComment.column("deleted_at") == None),  # noqa
            )
            .where(Project.column("uid") == project_uid)
            .order_by(Card.column("order").asc())
            .group_by(Card.column("id"), Card.column("order"))
        )
        raw_cards = result.all()
        cards = []
        for card, count_comment in raw_cards:
            card_api = await self.convert_board_list_api_response(card, count_comment)
            cards.append(card_api)

        return cards

    async def convert_board_list_api_response(self, card: Card, count_comment: int | None = None) -> dict[str, Any]:
        if count_comment is None:
            sql_query = (
                self._db.query("select").count(CardComment, "id").where(CardComment.column("card_uid") == card.uid)
            )

            result = await self._db.exec(sql_query)
            count_comment = result.one()

        sql_query = (
            self._db.query("select")
            .table(User)
            .join(CardAssignedUser, User.column("id") == CardAssignedUser.column("user_id"))
            .where(CardAssignedUser.column("card_id") == card.id)
        )

        result = await self._db.exec(sql_query)
        raw_users = result.all()

        sql_query = (
            self._db.query("select")
            .table(CardRelationship)
            .join(
                GlobalCardRelationshipType,
                CardRelationship.column("relation_type_id") == GlobalCardRelationshipType.column("id"),
            )
            .where(
                (CardRelationship.column("card_uid_parent") == card.uid)
                | (CardRelationship.column("card_uid_child") == card.uid)
            )
        )

        result = await self._db.exec(sql_query)
        raw_relationship = result.all()

        parents = []
        children = []
        for relationship in raw_relationship:
            if relationship.card_uid_parent == card.uid:
                children.append(relationship.card_uid_child)
            else:
                parents.append(relationship.card_uid_parent)

        card_api = card.api_response()
        card_api["count_comment"] = count_comment
        card_api["members"] = [user.api_response() for user in raw_users]
        card_api["relationships"] = {
            "parents": parents,
            "children": children,
        }
        return card_api

    async def create(
        self, user_or_bot: User | BotType, project: Project | int, column_uid: str, title: str
    ) -> ModelIdBaseResult[tuple[Card, dict[str, Any]]] | None:
        if isinstance(project, int):
            project = cast(Project, await self._get_by(Project, "id", project))
            if not project:
                return None

        if not project.id or column_uid == Project.ARCHIVE_COLUMN_UID:
            return None

        column = await self._get_by(ProjectColumn, "uid", column_uid)
        if not column or column.project_id != project.id:
            return None

        max_order = await self._get_max_order(Card, "project_id", project.id, {"project_column_uid": column_uid})

        card = Card(
            project_id=project.id,
            project_column_uid=column_uid,
            title=title,
            order=max_order + 1,
        )
        self._db.insert(card)
        await self._db.commit()

        model = await self.convert_board_list_api_response(card)
        model_id = await ModelIdService.create_model_id({"card": model})

        return ModelIdBaseResult(model_id, (card, model))

    async def update(
        self, user_or_bot: User | BotType, card: Card | int, form: dict
    ) -> ModelIdBaseResult[tuple[str | None, Checkitem | None]] | None:
        for immutable_key in ["id", "uid", "project_id"]:
            if immutable_key in form:
                form.pop(immutable_key)

        if isinstance(card, int):
            card = cast(Card, await self._get_by(Card, "id", card))
            if not card:
                return None

        old_card_record = {}

        for key, value in form.items():
            if hasattr(card, key):
                old_card_record[key] = getattr(card, key)
                if isinstance(old_card_record[key], BaseModel):
                    old_card_record[key] = old_card_record[key].model_dump()
                elif isinstance(old_card_record[key], datetime):
                    old_card_record[key] = old_card_record[key].isoformat()
                setattr(card, key, value)

        checkitem_cardified_from = None
        if form.get("title", None):
            checkitem_cardified_from = await self._get_by(Checkitem, "cardified_uid", card.uid)
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
            model[key] = getattr(card, key)
            if isinstance(model[key], EditorContentModel):
                model[key] = model[key].model_dump()
        model_id = await ModelIdService.create_model_id(model)

        return ModelIdBaseResult(model_id, (revert_key, checkitem_cardified_from))

    async def change_order(
        self, user: User, card_uid: str, order: int, column_uid: str = ""
    ) -> ModelIdBaseResult[tuple[Card, ProjectColumn, ProjectColumn | None]] | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Card, Project, ProjectColumn)
            .join(Project, Project.column("id") == Card.column("project_id"))
            .outerjoin(ProjectColumn, ProjectColumn.column("uid") == Card.column("project_column_uid"))
            .where(Card.uid == card_uid)
            .limit(1)
        )
        record = result.first()
        if not record:
            return None
        card, project, original_column = record

        original_column_uid = original_column.uid if original_column else Project.ARCHIVE_COLUMN_UID
        # original_column_name = original_column.name if original_column else project.archive_column_name
        if column_uid:
            if column_uid != Project.ARCHIVE_COLUMN_UID:
                new_column = await self._get_by(ProjectColumn, "uid", column_uid)
                if not new_column or new_column.project_id != card.project_id:
                    return None

                card.archived_at = None
                card.project_column_uid = column_uid
            else:
                project = await self._get_by(Project, "id", card.project_id)
                if not project:
                    return None
                card.archived_at = now()
                card.project_column_uid = None
        else:
            new_column = None

        original_order = card.order

        shared_update_query = (
            self._db.query("update")
            .table(Card)
            .where((Card.column("id") != card.id) & (Card.column("project_id") == card.project_id))
        )
        if column_uid:
            update_query = self.__filter_column(
                shared_update_query.values({Card.order: Card.order - 1}).where(Card.column("order") >= original_order),
                original_column_uid,
            )
            await self._db.exec(update_query)

            update_query = self.__filter_column(
                (shared_update_query.values({Card.order: Card.order + 1}).where(Card.column("order") >= order)),
                column_uid,
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

            update_query = self.__filter_column(update_query, original_column_uid)
            await self._db.exec(update_query)

        card.order = order
        await self._db.update(card)
        await self._db.commit()

        model = {
            "from_column_uid": original_column.uid,
            "uid": card.uid,
            "order": card.order,
        }
        if new_column:
            model["to_column_uid"] = new_column.uid
            model["column_name"] = new_column.name
        model_id = await ModelIdService.create_model_id(model)
        return ModelIdBaseResult(model_id, (card, original_column, new_column))

    async def update_assigned_users(
        self, user_or_bot: User | BotType, card: Card | int, assign_user_ids: list[int] | None = None
    ) -> ModelIdBaseResult[list[User]] | None:
        if isinstance(card, int):
            card = cast(Card, await self._get_by(Card, "id", card))
            if not card:
                return None

        # result = await self._db.exec(
        #     self._db.query("select").column(CardAssignedUser.user_id).where(CardAssignedUser.card_id == card.id)
        # )
        # original_assigned_user_ids = list(result.all())

        await self._db.exec(
            self._db.query("delete").table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id)
        )

        if assign_user_ids:
            result = await self._db.exec(
                self._db.query("select")
                .table(User)
                .join(ProjectAssignedUser, User.column("id") == ProjectAssignedUser.column("user_id"))
                .where(
                    (ProjectAssignedUser.column("project_id") == card.project_id)
                    & (ProjectAssignedUser.column("user_id").in_(assign_user_ids))
                )
            )
            users = result.all()
            for user in users:
                self._db.insert(CardAssignedUser(card_id=cast(int, card.id), user_id=cast(int, user.id)))
        else:
            users = []
        await self._db.commit()

        model_id = await ModelIdService.create_model_id({"assigned_users": [user.api_response() for user in users]})
        return ModelIdBaseResult(model_id, list(users))

    @overload
    def __filter_column(self, query: Select[_TSelectParam], column_uid: str) -> Select[_TSelectParam]: ...
    @overload
    def __filter_column(
        self, query: SelectOfScalar[_TSelectParam], column_uid: str
    ) -> SelectOfScalar[_TSelectParam]: ...
    @overload
    def __filter_column(self, query: Update, column_uid: str) -> Update: ...
    @overload
    def __filter_column(self, query: Delete, column_uid: str) -> Delete: ...
    def __filter_column(
        self,
        query: Select[_TSelectParam] | SelectOfScalar[_TSelectParam] | Update | Delete,
        column_uid: str,
    ):
        if column_uid == Project.ARCHIVE_COLUMN_UID:
            return query.where(Card.column("archived_at") != None)  # noqa
        return query.where(Card.column("project_column_uid") == column_uid)
