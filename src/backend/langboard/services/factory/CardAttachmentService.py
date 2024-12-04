from typing import Any, cast
from ...core.storage import FileModel
from ...models import Card, CardActivity, CardAttachment, ProjectActivity, User
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService


class CardAttachmentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_attachment"

    async def get_by_uid(self, uid: str) -> CardAttachment | None:
        return await self._get_by(CardAttachment, "uid", uid)

    async def get_board_list(self, card_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardAttachment, User)
            .join(User, CardAttachment.column("user_id") == User.column("id"))
            .where(CardAttachment.column("card_uid") == card_uid)
            .order_by(CardAttachment.column("order").asc(), CardAttachment.column("id").desc())
            .group_by(CardAttachment.column("id"), CardAttachment.column("order"))
        )
        card_attachments = result.all()

        return [
            {**card_attachment.api_response(), "user": user.api_response()}
            for card_attachment, user in card_attachments
        ]

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentAttached)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentAttached, no_user_activity=True
    )
    async def create(
        self, user: User, card_uid: str, attachment: FileModel
    ) -> tuple[ActivityResult, tuple[ActivityResult, CardAttachment]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        max_order = await self._get_max_order(CardAttachment, "card_uid", card_uid)

        card_attachment = CardAttachment(
            user_id=cast(int, user.id),
            card_uid=card.uid,
            filename=attachment.original_filename,
            file=attachment,
            order=max_order + 1,
        )

        self._db.insert(card_attachment)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card_attachment,
            shared={"project_id": card.project_id, "card_id": card.id, "card_attachment_id": card_attachment.id},
            new={"name": attachment.original_filename},
        )

        return activity_result, (activity_result, card_attachment)

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentChangedName)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentChangedName, no_user_activity=True
    )
    async def change_name(
        self, user: User, card_uid: str, card_attachment: CardAttachment, name: str
    ) -> tuple[ActivityResult, tuple[ActivityResult, bool]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        original_name = card_attachment.filename
        card_attachment.filename = name

        await self._db.update(card_attachment)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card_attachment,
            shared={"project_id": card.project_id, "card_id": card.id, "card_attachment_id": card_attachment.id},
            new={"name": name},
            old={"name": original_name},
        )

        return activity_result, (activity_result, True)

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentDeleted)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardAttachmentDeleted, no_user_activity=True
    )
    async def delete(
        self, user: User, card_uid: str, card_attachment: CardAttachment
    ) -> tuple[ActivityResult, tuple[ActivityResult, bool]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        await self._db.exec(
            self._db.query("update")
            .table(CardAttachment)
            .values({CardAttachment.order: CardAttachment.order - 1})
            .where(
                (CardAttachment.column("order") > card_attachment.order)
                & (CardAttachment.column("card_uid") == card_uid)
            )
        )

        await self._db.delete(card_attachment)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card_attachment,
            shared={"project_id": card.project_id, "card_id": card.id, "card_attachment_id": card_attachment.id},
            new={},
            old={"name": card_attachment.filename},
        )

        return activity_result, (activity_result, True)

    async def change_order(self, card_uid: str, file_uid: str, order: int) -> bool:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardAttachment, Card)
            .join(Card, Card.column("uid") == CardAttachment.column("card_uid"))
            .where((CardAttachment.column("uid") == file_uid) & (Card.column("uid") == card_uid))
        )
        card_attachment, card = result.first() or (None, None)
        if not card_attachment or not card:
            return False

        original_order = card_attachment.order
        update_query = (
            self._db.query("update").table(CardAttachment).where(CardAttachment.column("card_uid") == card_uid)
        )
        if original_order < order:
            update_query = update_query.values({CardAttachment.order: CardAttachment.order - 1}).where(
                (CardAttachment.column("order") <= order) & (CardAttachment.column("order") > original_order)
            )
        else:
            update_query = update_query.values({CardAttachment.order: CardAttachment.order + 1}).where(
                (CardAttachment.column("order") >= order) & (CardAttachment.column("order") < original_order)
            )
        await self._db.exec(update_query)

        card_attachment.order = order
        await self._db.update(card_attachment)
        await self._db.commit()

        return True
