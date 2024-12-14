from typing import Any, cast
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
from ...core.storage import FileModel
from ...models import Card, CardAttachment, User


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

    async def create(
        self, user: User, card_uid: str, attachment: FileModel
    ) -> ModelIdBaseResult[CardAttachment] | None:
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

        model_id = await ModelIdService.create_model_id(
            {"attachment": {**card_attachment.api_response(), "user": user.api_response(), "card_uid": card_uid}}
        )

        return ModelIdBaseResult(model_id, card_attachment)

    async def change_name(
        self, user: User, card_uid: str, card_attachment: CardAttachment, name: str
    ) -> ModelIdBaseResult[bool] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        # original_name = card_attachment.filename
        card_attachment.filename = name

        await self._db.update(card_attachment)
        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {
                "name": name,
            }
        )
        return ModelIdBaseResult(model_id, True)

    async def delete(
        self, user: User, card_uid: str, card_attachment: CardAttachment
    ) -> ModelIdBaseResult[bool] | None:
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

        model_id = await ModelIdService.create_model_id(
            {
                "uid": card_attachment.uid,
            }
        )
        return ModelIdBaseResult(model_id, True)

    async def change_order(self, card_uid: str, attachment_uid: str, order: int) -> ModelIdBaseResult[bool] | None:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardAttachment, Card)
            .join(Card, Card.column("uid") == CardAttachment.column("card_uid"))
            .where((CardAttachment.column("uid") == attachment_uid) & (Card.column("uid") == card_uid))
        )
        card_attachment, card = result.first() or (None, None)
        if not card_attachment or not card:
            return None

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

        model_id = await ModelIdService.create_model_id(
            {
                "uid": attachment_uid,
                "order": order,
            }
        )
        return ModelIdBaseResult(model_id, True)
