from typing import Any, cast, overload
from ...core.db import DbSession, SqlBuilder, User
from ...core.service import BaseService, ServiceHelper
from ...core.storage import FileModel
from ...models import Card, CardAttachment, Project
from ...publishers import CardAttachmentPublisher
from ...tasks.activities import CardAttachmentActivityTask
from ...tasks.bot import CardAttachmentBotTask
from .Types import TAttachmentParam, TCardParam, TProjectParam


class CardAttachmentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_attachment"

    async def get_by_uid(self, uid: str) -> CardAttachment | None:
        return await ServiceHelper.get_by_param(CardAttachment, uid)

    async def get_board_list(self, card: TCardParam) -> list[dict[str, Any]]:
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not card:
            return []
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(CardAttachment, User)
                .join(User, CardAttachment.column("user_id") == User.column("id"))
                .where(CardAttachment.column("card_id") == card.id)
                .order_by(CardAttachment.column("order").asc(), CardAttachment.column("id").desc())
                .group_by(CardAttachment.column("id"), CardAttachment.column("order"), User.column("id"))
            )
        card_attachments = result.all()

        return [
            {**card_attachment.api_response(), "user": user.api_response()}
            for card_attachment, user in card_attachments
        ]

    async def create(
        self, user: User, project: TProjectParam, card: TCardParam, attachment: FileModel
    ) -> CardAttachment | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card, _ = params

        max_order = await ServiceHelper.get_max_order(CardAttachment, "card_id", card.id)

        card_attachment = CardAttachment(
            user_id=user.id,
            card_id=card.id,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order + 1,
        )

        async with DbSession.use(readonly=False) as db:
            await db.insert(card_attachment)

        CardAttachmentPublisher.uploaded(user, card, card_attachment)
        CardAttachmentActivityTask.card_attachment_uploaded(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_uploaded(user, project, card, card_attachment)

        return card_attachment

    async def change_order(
        self, project: TProjectParam, card: TCardParam, card_attachment: TAttachmentParam, order: int
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, card_attachment)
        if not params:
            return None
        project, card, card_attachment = params

        original_order = card_attachment.order
        update_query = SqlBuilder.update.table(CardAttachment).where(CardAttachment.column("card_id") == card.id)
        update_query = ServiceHelper.set_order_in_column(update_query, CardAttachment, original_order, order)
        async with DbSession.use(readonly=False) as db:
            await db.exec(update_query)
            card_attachment.order = order
            await db.update(card_attachment)

        CardAttachmentPublisher.order_changed(card, card_attachment)

        return True

    async def change_name(
        self, user: User, project: TProjectParam, card: TCardParam, card_attachment: TAttachmentParam, name: str
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, card_attachment)
        if not params:
            return None
        project, card, card_attachment = params

        old_name = card_attachment.filename
        card_attachment.filename = name

        async with DbSession.use(readonly=False) as db:
            await db.update(card_attachment)

        CardAttachmentPublisher.name_changed(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_name_changed(user, project, card, old_name, card_attachment)
        CardAttachmentBotTask.card_attachment_name_changed(user, project, card, card_attachment)

        return True

    async def delete(
        self, user: User, project: TProjectParam, card: TCardParam, card_attachment: TAttachmentParam
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, card_attachment)
        if not params:
            return None
        project, card, card_attachment = params

        async with DbSession.use(readonly=False) as db:
            await db.exec(
                SqlBuilder.update.table(CardAttachment)
                .values({CardAttachment.order: CardAttachment.order - 1})
                .where(
                    (CardAttachment.column("order") > card_attachment.order)
                    & (CardAttachment.column("card_id") == card.id)
                )
            )
            await db.delete(card_attachment)

        CardAttachmentPublisher.deleted(card, card_attachment)
        CardAttachmentActivityTask.card_attachment_deleted(user, project, card, card_attachment)
        CardAttachmentBotTask.card_attachment_deleted(user, project, card, card_attachment)

        return True

    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam
    ) -> tuple[Project, Card, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, card_attachment: TAttachmentParam
    ) -> tuple[Project, Card, CardAttachment] | None: ...
    async def __get_records_by_params(  # type: ignore
        self, project: TProjectParam, card: TCardParam, card_attachment: TAttachmentParam | None = None
    ):
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not card or not project or card.project_id != project.id:
            return None

        if card_attachment:
            card_attachment = cast(CardAttachment, await ServiceHelper.get_by_param(CardAttachment, card_attachment))
            if not card_attachment or card_attachment.card_id != card.id:
                return None
        else:
            card_attachment = None

        return project, card, card_attachment
