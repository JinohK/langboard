from datetime import datetime
from typing import Any, Literal, cast, overload
from sqlalchemy import func
from ...core.ai import Bot
from ...core.db import DbSession, SnowflakeID, SqlBuilder, User
from ...core.schema import Pagination
from ...core.service import BaseService
from ...core.utils.DateTime import now
from ...models import (
    Card,
    CardAssignedProjectLabel,
    CardAssignedUser,
    CardComment,
    CardRelationship,
    Checkitem,
    Checklist,
    Project,
    ProjectColumn,
    ProjectLabel,
    ProjectRole,
)
from ...models.Checkitem import CheckitemStatus
from ...publishers import CardPublisher
from ...tasks.activities import CardActivityTask
from ...tasks.bot import CardBotTask
from .CardAttachmentService import CardAttachmentService
from .CardRelationshipService import CardRelationshipService
from .CheckitemService import CheckitemService
from .ChecklistService import ChecklistService
from .NotificationService import NotificationService
from .ProjectLabelService import ProjectLabelService
from .ProjectService import ProjectService
from .Types import TCardParam, TColumnParam, TProjectParam, TUserOrBot


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

        column = await self._get_by_param(ProjectColumn, card.project_column_id)
        if not column:
            return None

        api_card = card.api_response()

        checklist_service = self._get_service(ChecklistService)
        api_card["checklists"] = await checklist_service.get_list(card, as_api=True)

        project_service = self._get_service(ProjectService)
        api_card["project_members"] = await project_service.get_assigned_users(card.project_id, as_api=True)
        api_card["project_bots"] = await project_service.get_assigned_bots(card.project_id, as_api=True)

        card_attachment_service = self._get_service(CardAttachmentService)
        api_card["attachments"] = await card_attachment_service.get_board_list(card)

        project_label_service = self._get_service(ProjectLabelService)
        api_card["labels"] = await project_label_service.get_all_by_card(card, as_api=True)

        api_card["members"] = await self.get_assigned_users(card, as_api=True)

        card_relationship_service = self._get_service(CardRelationshipService)
        api_card["relationships"] = await card_relationship_service.get_all_by_card(card, as_api=True)
        return api_card

    async def get_board_list(self, project: TProjectParam) -> list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(
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
            api_card = await self.convert_board_list_api_response(card, count_comment)
            cards.append(api_card)

        return cards

    async def get_dashboard_list(
        self, user: User, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        query = (
            SqlBuilder.select.tables(Card, Project)
            .join(Project, Card.column("project_id") == Project.column("id"))
            .join(ProjectRole, Project.column("id") == ProjectRole.column("project_id"))
            .outerjoin(CardAssignedUser, Card.column("id") == CardAssignedUser.column("card_id"))
            .where(
                (ProjectRole.column("user_id") == user.id)
                & (
                    (
                        (ProjectRole.column("actions") == "*")
                        & (
                            (CardAssignedUser.column("card_id") == None)  # noqa
                            | (CardAssignedUser.column("user_id") == user.id)
                        )
                    )
                    | ((ProjectRole.column("actions") != "*") & (CardAssignedUser.column("user_id") == user.id))
                )
            )
            .where(Checkitem.column("created_at") <= refer_time)
            .order_by(Card.column("created_at").desc())
            .group_by(Card.column("id"), Card.column("created_at"))
        )
        query = self.paginate(query, pagination.page, pagination.limit)
        async with DbSession.use() as db:
            result = await db.exec(query)
        cards = result.all()

        api_cards = []
        api_projects: dict[int, dict[str, Any]] = {}
        for card, project in cards:
            api_card = card.api_response()
            column = await self._get_by_param(ProjectColumn, card.project_column_id)
            if not column:
                continue
            api_card["column_name"] = column.name
            if project.id not in api_projects:
                api_projects[project.id] = project.api_response()
            api_cards.append(api_card)
        return api_cards, list(api_projects.values())

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
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.tables(User, CardAssignedUser)
                .join(CardAssignedUser, User.column("id") == CardAssignedUser.column("user_id"))
                .where(CardAssignedUser.column("card_id") == card.id)
            )
        raw_users = result.all()
        if not as_api:
            return list(raw_users)

        users = [user.api_response() for user, _ in raw_users]
        return users

    async def convert_board_list_api_response(self, card: Card, count_comment: int | None = None) -> dict[str, Any]:
        if count_comment is None:
            async with DbSession.use() as db:
                result = await db.exec(
                    SqlBuilder.select.count(CardComment, "id").where(CardComment.column("card_id") == card.id)
                )
            count_comment = result.first() or 0

        project_label_service = self._get_service(ProjectLabelService)
        card_relationship_service = self._get_service(CardRelationshipService)
        checklist_service = self._get_service(ChecklistService)

        api_card = card.api_response()
        api_card["count_comment"] = count_comment
        api_card["members"] = await self.get_assigned_users(card, as_api=True)
        api_card["relationships"] = await card_relationship_service.get_all_by_card(card, as_api=True)
        api_card["labels"] = await project_label_service.get_all_by_card(card, as_api=True)
        api_card["checklists"] = await checklist_service.get_list_only(card, as_api=True)

        return api_card

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, column: TColumnParam, title: str
    ) -> tuple[Card, dict[str, Any]] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, column))
        if not project or not column or column.project_id != project.id or column.is_archive:
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
        async with DbSession.use() as db:
            db.insert(card)
            await db.commit()

        api_card = await self.convert_board_list_api_response(card)
        model = {"card": api_card}

        CardPublisher.created(project, column, model)
        CardActivityTask.card_created(user_or_bot, project, card)
        CardBotTask.card_created(user_or_bot, project, card)

        return card, api_card

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
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
            if old_value == new_value or (key == "title" and not new_value):
                continue
            old_card_record[key] = self._convert_to_python(old_value)
            setattr(card, key, new_value)

        if not old_card_record:
            return True

        checkitem_cardified_from = None
        if "title" in old_card_record:
            checkitem_cardified_from = await self._get_by(Checkitem, "cardified_id", card.id)
            if checkitem_cardified_from:
                checkitem_cardified_from.title = card.title
                async with DbSession.use() as db:
                    await db.update(checkitem_cardified_from)
                    await db.commit()

        async with DbSession.use() as db:
            await db.update(card)
            await db.commit()

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_card_record:
                continue
            model[key] = self._convert_to_python(getattr(card, key))

        CardPublisher.updated(project, card, checkitem_cardified_from, model)

        if "description" in model and card.description:
            notification_service = self._get_service(NotificationService)
            await notification_service.notify_mentioned_at_card(user_or_bot, project, card)

        CardActivityTask.card_updated(user_or_bot, project, old_card_record, card)
        CardBotTask.card_updated(user_or_bot, project, old_card_record, card)

        return model

    async def change_order(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        order: int,
        new_column: TColumnParam | None,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        original_column = None
        original_column = await self._get_by_param(ProjectColumn, card.project_column_id)
        if not original_column or original_column.project_id != project.id:
            return None

        if new_column:
            new_column = cast(ProjectColumn, await self._get_by_param(ProjectColumn, new_column))
            if not new_column or new_column.project_id != card.project_id:
                return None

            card.project_column_id = new_column.id
            card.archived_at = now() if new_column.is_archive else None

        original_order = card.order

        shared_update_query = SqlBuilder.update.table(Card).where(
            (Card.column("id") != card.id) & (Card.column("project_id") == card.project_id)
        )

        if new_column:
            update_query = shared_update_query.values({Card.order: Card.order - 1}).where(
                (Card.column("order") >= original_order) & (Card.column("project_column_id") == original_column.id)
            )
            async with DbSession.use() as db:
                await db.exec(update_query)
                await db.commit()

            update_query = shared_update_query.values({Card.order: Card.order + 1}).where(
                (Card.column("order") >= order) & (Card.column("project_column_id") == new_column.id)
            )
            async with DbSession.use() as db:
                await db.exec(update_query)
                await db.commit()
        else:
            update_query = self._set_order_in_column(shared_update_query, Card, original_order, order)
            update_query = update_query.where(Card.column("project_column_id") == original_column.id)
            async with DbSession.use() as db:
                await db.exec(update_query)
                await db.commit()

        async with DbSession.use() as db:
            card.order = order
            await db.update(card)
            await db.commit()

        CardPublisher.order_changed(project, card, original_column, cast(ProjectColumn, new_column))

        if new_column:
            CardActivityTask.card_moved(user_or_bot, project, card, original_column)
            CardBotTask.card_moved(user_or_bot, project, card, original_column)

        return True

    async def update_assigned_users(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        assign_user_uids: list[str] | None = None,
    ) -> list[User] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.column(CardAssignedUser.user_id).where(CardAssignedUser.card_id == card.id)
            )
        original_assigned_user_ids = list(result.all())

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id)
            )
            await db.commit()

        async with DbSession.use() as db:
            users = []
            if assign_user_uids:
                assign_user_ids = [SnowflakeID.from_short_code(uid) for uid in assign_user_uids]
                project_service = self._get_service(ProjectService)
                raw_users = await project_service.get_assigned_users(
                    project.id, as_api=False, where_user_ids_in=assign_user_ids
                )
                users: list[User] = []
                for user, project_assigned_user in raw_users:
                    db.insert(
                        CardAssignedUser(project_assigned_id=project_assigned_user.id, card_id=card.id, user_id=user.id)
                    )
                    users.append(user)
            await db.commit()

        CardPublisher.assigned_users_updated(project, card, users)

        notification_service = self._get_service(NotificationService)
        for user in users:
            if user.id in original_assigned_user_ids:
                continue
            await notification_service.notify_assigned_to_card(user_or_bot, user, project, card)

        CardActivityTask.card_assigned_users_updated(
            user_or_bot,
            project,
            card,
            [user_id for user_id in original_assigned_user_ids],
            [user.id for user in users],
        )

        return list(users)

    async def update_labels(
        self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam, label_uids: list[str]
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card = params

        project_label_service = self._get_service(ProjectLabelService)
        is_bot = isinstance(user_or_bot, Bot)

        original_labels = await project_label_service.get_all_by_card(card, as_api=False)

        query = SqlBuilder.delete.table(CardAssignedProjectLabel).where(
            CardAssignedProjectLabel.column("card_id") == card.id
        )
        if not is_bot:
            bot_labels = await project_label_service.get_all_bot(project)
            bot_label_ids = [label.id for label in bot_labels]
            query = query.where(CardAssignedProjectLabel.column("project_label_id").not_in(bot_label_ids))
        async with DbSession.use() as db:
            await db.exec(query)
            await db.commit()

        async with DbSession.use() as db:
            for label_uid in label_uids:
                label = await self._get_by_param(ProjectLabel, label_uid)
                if not label or label.project_id != project.id or (not is_bot and label.bot_id):
                    return None
                db.insert(CardAssignedProjectLabel(card_id=card.id, project_label_id=label.id))
            await db.commit()

        labels = await project_label_service.get_all_by_card(card, as_api=False)

        CardPublisher.labels_updated(project, card, labels)
        CardActivityTask.card_labels_updated(
            user_or_bot,
            project,
            card,
            [label.id for label in original_labels],
            [label.id for label in labels],
        )
        CardBotTask.card_labels_updated(user_or_bot, project, card)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, card: TCardParam) -> bool:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return False
        project, card = params

        if not card.archived_at:
            return False

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(Checkitem)
                .join(Checklist, Checkitem.column("checklist_id") == Checklist.column("id"))
                .where(
                    (Checklist.column("card_id") == card.id) & (Checkitem.column("status") == CheckitemStatus.Started)
                )
            )
        started_checkitems = result.all()

        checkitem_service = self._get_service(CheckitemService)
        current_time = now()
        for checkitem in started_checkitems:
            await checkitem_service.change_status(
                user_or_bot, project, card, checkitem, CheckitemStatus.Stopped, current_time, should_publish=False
            )

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(CardAssignedUser).where(CardAssignedUser.column("card_id") == card.id)
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.delete.table(CardRelationship).where(
                    (CardRelationship.column("card_id_parent") == card.id)
                    | (CardRelationship.column("card_id_child") == card.id)
                )
            )
            await db.commit()

        async with DbSession.use() as db:
            await db.delete(card)
            await db.commit()

        async with DbSession.use() as db:
            await db.exec(
                SqlBuilder.update.table(Card)
                .values({Card.order: Card.order - 1})
                .where(
                    (Card.column("project_id") == project.id)
                    & (Card.column("project_column_id") == card.project_column_id)
                    & (Card.column("order") > card.order)
                )
            )
            await db.commit()

        CardPublisher.deleted(project, card)
        CardActivityTask.card_deleted(user_or_bot, project, card)
        CardBotTask.card_deleted(user_or_bot, project, card)

        return True

    async def __get_records_by_params(self, project: TProjectParam, card: TCardParam):
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        return project, card
