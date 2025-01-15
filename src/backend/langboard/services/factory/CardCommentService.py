from typing import Any, cast, overload
from ...core.ai import Bot
from ...core.db import EditorContentModel, User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...models import Card, CardComment, CardCommentReaction, Project
from .NotificationService import NotificationService
from .ReactionService import ReactionService
from .Types import TCardParam, TCommentParam, TProjectParam, TUserOrBot


_SOCKET_PREFIX = "board:card:comment"


class CardCommentService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "card_comment"

    async def get_by_uid(self, uid: str) -> CardComment | None:
        return await self._get_by_param(CardComment, uid)

    async def get_board_list(self, card: TCardParam) -> list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .tables(CardComment, User, Bot, with_deleted=True)
            .outerjoin(User, CardComment.column("user_id") == User.column("id"))
            .outerjoin(Bot, CardComment.column("bot_id") == Bot.column("id"))
            .where(CardComment.column("card_id") == card.id)
            .order_by(CardComment.column("created_at").desc(), CardComment.column("id").desc())
            .group_by(CardComment.column("id"), CardComment.column("created_at"), User.column("id"), Bot.column("id"))
        )
        raw_comments = result.all()

        reaction_service = self._get_service(ReactionService)

        comments = []
        for comment, user, bot in raw_comments:
            if comment.deleted_at is not None:
                continue
            api_comment = comment.api_response()
            if user:
                api_comment["user"] = user.api_response()
            else:
                api_comment["bot"] = bot.api_response()
            api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.id)
            comments.append(api_comment)

        return comments

    async def create(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        content: EditorContentModel | dict[str, Any],
    ) -> tuple[CardComment, dict[str, Any]] | None:
        params = await self.__get_records_by_params(project, card)
        if not params:
            return None
        project, card, _ = params

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        comment_params = {
            "card_id": card.id,
            "content": content,
        }

        if isinstance(user_or_bot, User):
            comment_params["user_id"] = user_or_bot.id
        else:
            comment_params["bot_id"] = user_or_bot.id

        comment = CardComment(**comment_params)
        self._db.insert(comment)
        await self._db.commit()

        reaction_service = self._get_service(ReactionService)

        api_comment = comment.api_response()
        if isinstance(user_or_bot, User):
            api_comment["user"] = user_or_bot.api_response()
        else:
            api_comment["bot"] = user_or_bot.api_response()
        api_comment["reactions"] = await reaction_service.get_all(CardCommentReaction, comment.id)

        model = {"comment": api_comment}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:added:{card.get_uid()}",
            data_keys="comment",
        )

        SocketPublishService.put_dispather(model, publish_model)

        notification_service = self._get_service(NotificationService)
        await notification_service.notify_mentioned_at_comment(user_or_bot, project, card, comment)

        return comment, api_comment

    async def update(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
        content: EditorContentModel | dict[str, Any],
    ) -> CardComment | None:
        params = await self.__get_records_by_params(project, card, comment)
        if not params:
            return None
        project, card, comment = params

        if isinstance(content, dict):
            content = EditorContentModel(**content)

        # old_content = comment.content
        comment.content = content
        await self._db.update(comment)
        await self._db.commit()

        model = {
            "content": content.model_dump(),
            "card_uid": card.get_uid(),
            "uid": comment.get_uid(),
            "commented_at": comment.updated_at,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:updated:{card.get_uid()}",
            data_keys=["content", "card_uid", "uid", "commented_at"],
        )

        SocketPublishService.put_dispather(model, publish_model)

        return comment

    async def delete(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
    ) -> CardComment | None:
        params = await self.__get_records_by_params(project, card, comment)
        if not params:
            return None
        project, card, comment = params

        await self._db.delete(comment)
        await self._db.commit()

        model = {"card_uid": card.get_uid(), "comment_uid": comment.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:deleted:{card.get_uid()}",
            data_keys=["card_uid", "comment_uid"],
        )

        SocketPublishService.put_dispather(model, publish_model)

        return comment

    async def toggle_reaction(
        self,
        user_or_bot: TUserOrBot,
        project: TProjectParam,
        card: TCardParam,
        comment: TCommentParam,
        reaction: str,
    ) -> bool | None:
        params = await self.__get_records_by_params(project, card, comment)
        if not params:
            return None
        project, card, comment = params

        reaction_service = self._get_service(ReactionService)
        is_reacted = await reaction_service.toggle(user_or_bot, CardCommentReaction, comment.id, reaction)

        model = {
            "comment_uid": comment.get_uid(),
            "reaction": reaction,
            "is_reacted": is_reacted,
        }

        if isinstance(user_or_bot, User):
            model["user_uid"] = user_or_bot.get_uid()
        else:
            model["bot_uid"] = user_or_bot.get_uid()

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:reacted:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

        return is_reacted

    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam
    ) -> tuple[Project, Card, None] | None: ...
    @overload
    async def __get_records_by_params(
        self, project: TProjectParam, card: TCardParam, comment: TCommentParam
    ) -> tuple[Project, Card, CardComment] | None: ...
    async def __get_records_by_params(  # type: ignore
        self, project: TProjectParam, card: TCardParam, comment: TCommentParam | None = None
    ):
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not card or not project or card.project_id != project.id:
            return None

        if comment:
            comment = cast(CardComment, await self._get_by_param(CardComment, comment))
            if not comment or comment.card_id != card.id:
                return None
        else:
            comment = None

        return project, card, comment
