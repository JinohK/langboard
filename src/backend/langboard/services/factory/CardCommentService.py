from typing import Any, Literal, cast, overload
from ...core.db import EditorContentModel
from ...models import Card, CardActivity, CardComment, CardCommentReaction, ProjectActivity, User
from ..BaseService import BaseService
from .ActivityService import ActivityResult, ActivityService
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
            .join(User, CardComment.column("user_id") == User.column("id"))
            .where(CardComment.column("card_uid") == card_uid)
            .order_by(CardComment.column("created_at").desc(), CardComment.column("id").desc())
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

    @overload
    async def create(self, user: User, card_uid: str, content: EditorContentModel) -> CardComment: ...
    @overload
    async def create(
        self, user: User, card_uid: str, content: EditorContentModel, resepond_as_api: Literal[False]
    ) -> CardComment: ...
    @overload
    async def create(
        self, user: User, card_uid: str, content: EditorContentModel, resepond_as_api: Literal[True]
    ) -> dict[str, Any]: ...
    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardCommentAdded)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardCommentAdded, no_user_activity=True
    )
    async def create(
        self, user: User, card_uid: str, content: EditorContentModel, resepond_as_api: bool = False
    ) -> tuple[ActivityResult, tuple[ActivityResult, CardComment | dict[str, Any]]] | None:
        card = await self._get_by(Card, "uid", card_uid)
        if not card:
            return None

        comment = CardComment(
            user_id=cast(int, user.id),
            card_uid=card.uid,
            content=content,
        )
        self._db.insert(comment)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card,
            shared={"project_id": card.project_id},
            new={"content": content.model_dump()},
        )

        if not resepond_as_api:
            return activity_result, (activity_result, comment)

        reaction_service = self._get_service(ReactionService)

        api_comment = comment.api_response()
        api_comment["user"] = user.api_response()
        api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.uid)
        return activity_result, (activity_result, api_comment)

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardCommentUpdated)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardCommentUpdated, no_user_activity=True
    )
    async def update(
        self, user: User, comment: CardComment, content: EditorContentModel
    ) -> tuple[ActivityResult, tuple[ActivityResult, CardComment]] | None:
        card = await self._get_by(Card, "uid", comment.card_uid)
        if not card:
            return None

        old_content = comment.content
        comment.content = content
        await self._db.update(comment)

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card,
            shared={"project_id": card.project_id, "comment_id": comment.id},
            new={"content": content.model_dump()},
            old={"content": old_content.model_dump() if old_content else None},
        )

        return activity_result, (activity_result, comment)

    @ActivityService.activity_method(CardActivity, ActivityService.ACTIVITY_TYPES.CardCommentDeleted)
    @ActivityService.activity_method(
        ProjectActivity, ActivityService.ACTIVITY_TYPES.CardCommentDeleted, no_user_activity=True
    )
    async def delete(
        self, user: User, comment: CardComment
    ) -> tuple[ActivityResult, tuple[ActivityResult, CardComment]] | None:
        card = await self._get_by(Card, "uid", comment.card_uid)
        if not card:
            return None

        await self._db.delete(comment)
        await self._db.commit()

        activity_result = ActivityResult(
            user_or_bot=user,
            model=card,
            shared={"project_id": card.project_id, "comment_id": comment.id},
            new={},
            old={"content": comment.content.model_dump() if comment.content else None},
        )

        return activity_result, (activity_result, comment)
