from typing import Any, TypeVar, overload
from sqlalchemy import Delete, Update, func
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardActivity,
    CardAssignedUser,
    CardComment,
    CardCommentReaction,
    CardFile,
    CardRelationship,
    GlobalCardRelationshipType,
    Project,
    ProjectColumn,
    User,
)
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService
from .CheckitemService import CheckitemService
from .ReactionService import ReactionService


_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class CardService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card"

    async def get_by_id(self, card_id: int | None) -> Card | None:
        return await self._get_by(Card, "id", card_id)

    async def get_details(self, card_uid: str) -> dict[str, Any] | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(Card, ProjectColumn)
            .join(ProjectColumn, Card.column("project_column_uid") == ProjectColumn.column("uid"))
            .where(Card.column("uid") == card_uid)
        )
        card, column = result.first() or (None, None)
        if card is None or column is None:
            return None

        api_card = card.api_response()
        api_card["deadline_at"] = card.deadline_at
        api_card["column_name"] = column.name

        checkitem_service = self._get_service(CheckitemService)
        api_card["checkitems"] = await checkitem_service.get_list(card.uid)

        result = await self._db.exec(
            self._db.query("select")
            .tables(CardFile, User)
            .join(User, CardFile.column("user_id") == User.column("id"))
            .where(CardFile.column("card_uid") == card_uid)
            .order_by(CardFile.column("order").asc())
            .group_by(CardFile.column("order"))
        )
        card_files = result.all()
        api_card["files"] = [
            {**card_file.api_response(), "user": user.api_response()} for card_file, user in card_files
        ]

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
        sql_query = (
            self._db.query("select")
            .tables(
                Card,
                func.count(CardComment.column("id")).label("comment_count"),  # type: ignore
            )
            .join(Project, Card.column("project_id") == Project.column("id"))
            .outerjoin(CardComment, Card.column("uid") == CardComment.column("card_uid"))
            .where(Project.column("uid") == project_uid)
            .order_by(Card.column("order").asc())
            .group_by(Card.column("id"), Card.column("order"))
        )

        result = await self._db.exec(sql_query)
        raw_cards = result.all()

        cards = []

        for card, comment_count in raw_cards:
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
            card_api["comment_count"] = comment_count
            card_api["members"] = [user.api_response() for user in raw_users]
            card_api["relationships"] = {
                "parents": parents,
                "children": children,
            }

            cards.append(card_api)

        return cards

    async def get_comments(self, card_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardComment, User)
            .join(User, CardComment.column("user_id") == User.column("id"))
            .where(CardComment.column("card_uid") == card_uid)
            .order_by(CardComment.column("created_at").asc(), CardComment.column("id").asc())
            .group_by(CardComment.column("id"), CardComment.column("created_at"))
        )
        raw_comments = result.all()

        reaction_service = self._get_service(ReactionService)

        comments = []
        for comment, user in raw_comments:
            api_comment = comment.api_response()
            api_comment["user"] = user.api_response()
            api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.uid)
            comments.append(api_comment)

        return comments

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardCreated)
    async def create(
        self, user: User, project: Project, column_uid: str, title: str
    ) -> tuple[ActivityResult, Card] | None:
        if not project.id or column_uid == Project.ARCHIVE_COLUMN_UID:
            return None

        result = await self._db.exec(
            self._db.query("select")
            .column(Card.order)
            .where((Card.column("project_column_uid") == column_uid) & (Card.column("project_id") == project.id))
            .order_by(Card.column("order").desc())
            .group_by(Card.column("order"))
            .limit(1)
        )
        last_order = result.first()
        if last_order is None:
            last_order = -1

        card = Card(
            project_id=project.id,
            project_column_uid=column_uid,
            title=title,
            order=last_order + 1,
        )
        self._db.insert(card)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card,
            shared={"project_uid": project.uid},
            new={"title": title, "column_uid": column_uid},
        )

        return activity_result, card

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardChangedColumn)
    async def change_order(
        self, user: User, card_uid: str, order: int, column_uid: str = ""
    ) -> tuple[ActivityResult | None, bool]:
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
            return None, False
        card, project, original_column = record

        original_column_uid = original_column.uid if original_column else Project.ARCHIVE_COLUMN_UID
        original_column_name = original_column.name if original_column else project.archive_column_name
        if column_uid:
            if column_uid != Project.ARCHIVE_COLUMN_UID:
                column = await self._get_by(ProjectColumn, "uid", column_uid)
                if not column or column.project_id != card.project_id:
                    return None, False

                card.archived_at = None
                card.project_column_uid = column_uid
            else:
                project = await self._get_by(Project, "id", card.project_id)
                if not project:
                    return None, False
                card.archived_at = now()
                card.project_column_uid = None

        original_order = card.order

        shared_update_query = (
            self._db.query("update")
            .table(Card)
            .where((Card.column("id") != card.id) & (Card.column("project_id") == card.project_id))
        )
        if column_uid:
            update_query = self.__filter_column(
                shared_update_query.values({Card.order: Card.order - 1}).where(
                    (Card.column("order") >= original_order)
                ),
                original_column_uid,
            )
            await self._db.exec(update_query)

            update_query = self.__filter_column(
                (shared_update_query.values({Card.order: Card.order + 1}).where((Card.column("order") >= order))),
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

        if column_uid:
            activity_result = ActivityResult(
                user_or_bot=user,
                model=card,
                shared={
                    "project_uid": project.uid,
                },
                new={
                    "column_uid": column_uid,
                    "column_name": (
                        column.name if column_uid != Project.ARCHIVE_COLUMN_UID else project.archive_column_name
                    ),
                },
                old={
                    "column_uid": original_column_uid,
                    "column_name": original_column_name,
                },
            )
        else:
            activity_result = None
            await self._db.commit()

        return activity_result, True

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
