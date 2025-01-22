from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Card, Checklist


@staticclass
class ChecklistPublisher:
    @staticmethod
    def created(card: Card, checklist: Checklist):
        model = {"checklist": {**checklist.api_response(), "checkitems": []}}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event="board:card:checklist:created",
            data_keys="checklist",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def title_changed(card: Card, checklist: Checklist):
        model = {"title": checklist.title}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"board:card:checklist:title:changed:{checklist.get_uid()}",
            data_keys="title",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def order_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "order": checklist.order}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"board:card:checklist:order:changed:{topic_id}",
            data_keys=["uid", "order"],
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def checked_changed(card: Card, checklist: Checklist):
        model = {"is_checked": checklist.is_checked}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"board:card:checklist:checked:changed:{checklist.get_uid()}",
            data_keys="is_checked",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def deleted(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid()}
        topic_id = card.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event="board:card:checklist:deleted",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)
