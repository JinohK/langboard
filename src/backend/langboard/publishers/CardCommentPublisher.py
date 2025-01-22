from ..core.ai import Bot
from ..core.db import User
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Card, CardComment, Project


@staticclass
class CardCommentPublisher:
    @staticmethod
    def created(user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment):
        api_comment = comment.api_response()
        author_key = "user" if isinstance(user_or_bot, User) else "bot"
        api_comment[author_key] = user_or_bot.api_response()
        api_comment["reactions"] = {}

        model = {"comment": api_comment}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:comment:added:{card.get_uid()}",
            data_keys="comment",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def updated(project: Project, card: Card, comment: CardComment):
        model = {
            "content": comment.content.model_dump() if comment.content else {"content": ""},
            "card_uid": card.get_uid(),
            "uid": comment.get_uid(),
            "commented_at": comment.updated_at,
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:comment:updated:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def deleted(project: Project, card: Card, comment: CardComment):
        model = {"card_uid": card.get_uid(), "comment_uid": comment.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:comment:deleted:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def reacted(
        user_or_bot: User | Bot, project: Project, card: Card, comment: CardComment, reaction: str, is_reacted: bool
    ):
        author_key = "user" if isinstance(user_or_bot, User) else "bot"
        model = {
            "comment_uid": comment.get_uid(),
            "reaction": reaction,
            "is_reacted": is_reacted,
            author_key: user_or_bot.api_response(),
        }

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:comment:reacted:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)
