from typing import Any, cast
from ...core.ai import BotRunner, BotType
from ...core.db import EditorContentModel
from ...core.service import BaseService, ModelIdBaseResult, ModelIdService
from ...models import Card, CardComment, CardCommentReaction, User
from .ReactionService import ReactionService


class CardCommentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_comment"

    async def get_by_uid(self, uid: str) -> CardComment | None:
        return await self._get_by(CardComment, "uid", uid)

    async def get_board_list(self, card_uid: str) -> list[dict[str, Any]]:
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardComment, User)
            .outerjoin(User, CardComment.column("user_id") == User.column("id"))
            .where(CardComment.column("card_uid") == card_uid)
            .order_by(CardComment.column("created_at").desc(), CardComment.column("id").desc())
            .group_by(CardComment.column("id"), CardComment.column("created_at"))
        )
        raw_comments = result.all()

        reaction_service = self._get_service(ReactionService)

        comments = []
        for comment, user in raw_comments:
            api_comment = comment.api_response()
            if user:
                api_comment["user"] = user.api_response()
            elif comment.bot_type:
                api_comment["user"] = BotRunner.get_bot_as_user_api(comment.bot_type)
            else:
                continue
            api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.uid)
            comments.append(api_comment)

        return comments

    async def create(
        self,
        user_or_bot: User | BotType,
        card_uid: str,
        content: EditorContentModel | dict[str, Any],
    ) -> ModelIdBaseResult[tuple[CardComment, dict[str, Any]]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        comment_params = {
            "card_uid": card.uid,
            "content": content,
        }

        if isinstance(user_or_bot, User):
            comment_params["user_id"] = user_or_bot.id
        else:
            comment_params["bot_type"] = user_or_bot

        comment = CardComment(**comment_params)
        self._db.insert(comment)
        await self._db.commit()

        reaction_service = self._get_service(ReactionService)

        api_comment = comment.api_response()
        api_comment["user"] = (
            user_or_bot.api_response() if isinstance(user_or_bot, User) else BotRunner.get_bot_as_user_api(user_or_bot)
        )
        api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.uid)

        model_id = await ModelIdService.create_model_id({"comment": api_comment, "card_uid": card_uid})

        return ModelIdBaseResult(model_id, (comment, api_comment))

    async def update(
        self, user_or_bot: User | BotType, comment: CardComment | int, content: EditorContentModel | dict[str, Any]
    ) -> ModelIdBaseResult[CardComment] | None:
        if isinstance(comment, int):
            comment = cast(CardComment, await self._get_by(CardComment, "id", comment))
            if not comment:
                return None

        card = await self._get_by(Card, "uid", comment.card_uid)
        if not card:
            return None

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        # old_content = comment.content
        comment.content = content
        await self._db.update(comment)
        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {
                "content": content.model_dump(),
                "card_uid": comment.card_uid,
                "uid": comment.uid,
                "commented_at": comment.updated_at,
            }
        )
        return ModelIdBaseResult(model_id, comment)

    async def delete(
        self, user_or_bot: User | BotType, comment: CardComment | int
    ) -> ModelIdBaseResult[CardComment] | None:
        if isinstance(comment, int):
            comment = cast(CardComment, await self._get_by(CardComment, "id", comment))
            if not comment:
                return None

        card = await self._get_by(Card, "uid", comment.card_uid)
        if not card:
            return None

        await self._db.delete(comment)
        await self._db.commit()

        model_id = await ModelIdService.create_model_id(
            {
                "card_uid": comment.card_uid,
                "comment_uid": comment.uid,
            }
        )
        return ModelIdBaseResult(model_id, comment)
