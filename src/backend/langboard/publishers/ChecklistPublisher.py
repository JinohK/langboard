from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Card, Checklist


@staticclass
class ChecklistPublisher:
    @staticmethod
    def created(card: Card, checklist: Checklist):
        model = {"checklist": {**checklist.api_response(), "checkitems": []}}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:created:{card.get_uid()}",
            data_keys="checklist",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def title_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "title": checklist.title}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:title:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def order_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "order": checklist.order}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:order:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def checked_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "is_checked": checklist.is_checked}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:checked:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def deleted(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid()}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:deleted:{card.get_uid()}",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)
