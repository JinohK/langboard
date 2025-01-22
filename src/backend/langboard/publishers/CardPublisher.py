from typing import Any
from ..core.db import User
from ..core.routing import SocketTopic
from ..core.service import SocketPublishModel, SocketPublishService
from ..core.utils.decorators import staticclass
from ..models import Card, Checkitem, Project, ProjectColumn, ProjectLabel


@staticclass
class CardPublisher:
    @staticmethod
    def created(project: Project, column: Project | ProjectColumn, model: dict[str, Any]):
        topic_id = project.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:card:created:{column.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:card:created:{topic_id}",
                custom_data={"column_uid": column.get_uid()},
            ),
        ]

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def updated(project: Project, card: Card, checkitem_cardified_from: Checkitem | None, model: dict[str, Any]):
        topic_id = project.get_uid()
        card_uid = card.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:card:details:changed:{card_uid}",
                data_keys=list(model.keys()),
            ),
        ]
        if checkitem_cardified_from:
            checkitem_uid = checkitem_cardified_from.get_uid()
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.Dashboard,
                        topic_id=topic_id,
                        event=f"dashboard:card:title:changed:{topic_id}",
                        data_keys="title",
                        custom_data={"uid": card_uid},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=card_uid,
                        event=f"board:card:checkitem:title:changed:{checkitem_uid}",
                        data_keys="title",
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Dashboard,
                        topic_id=topic_id,
                        event=f"dashboard:checkitem:title:changed:{topic_id}",
                        data_keys="title",
                        custom_data={"uid": checkitem_uid},
                    ),
                ]
            )

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def order_changed(
        project: Project, card: Card, old_column: Project | ProjectColumn, new_column: Project | ProjectColumn | None
    ):
        model = {
            "uid": card.get_uid(),
            "order": card.order,
        }

        old_column_uid = CardPublisher.__get_column_uid(old_column)

        if new_column:
            new_column_uid = CardPublisher.__get_column_uid(new_column)
            model["to_column_uid"] = new_column_uid
            model["column_name"] = CardPublisher.__get_column_name(new_column)

        publish_models: list[SocketPublishModel] = []
        topic_id = project.get_uid()
        card_uid = model["uid"]
        if new_column:
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=topic_id,
                        event=f"board:card:order:changed:{new_column_uid}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "to_column", "column_uid": new_column_uid},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=topic_id,
                        event=f"board:card:order:changed:{old_column_uid}",
                        data_keys=["uid", "order"],
                        custom_data={"move_type": "from_column", "column_uid": old_column_uid},
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=card_uid,
                        event=f"board:card:order:changed:{card_uid}",
                        data_keys=["to_column_uid", "column_name"],
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Dashboard,
                        topic_id=topic_id,
                        event=f"dashboard:card:order:changed:{topic_id}",
                        data_keys=["to_column_uid", "column_name"],
                        custom_data={
                            "uid": card_uid,
                            "from_column_uid": old_column_uid,
                            "archived_at": card.archived_at,
                        },
                    ),
                ]
            )
        else:
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.Board,
                    topic_id=topic_id,
                    event=f"board:card:order:changed:{old_column_uid}",
                    data_keys=["uid", "order"],
                    custom_data={"move_type": "in_column"},
                )
            )

        SocketPublishService.put_dispather(model, publish_models)

    @staticmethod
    def assigned_users_updated(project: Project, card: Card, users: list[User]):
        model = {"assigned_members": [user.api_response() for user in users]}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:assigned-users:updated:{card.get_uid()}",
            data_keys="assigned_members",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def labels_updated(project: Project, card: Card, labels: list[ProjectLabel]):
        model = {"labels": [label.api_response() for label in labels]}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"board:card:labels:updated:{card.get_uid()}",
            data_keys="labels",
        )

        SocketPublishService.put_dispather(model, publish_model)

    @staticmethod
    def deleted(project: Project, card: Card):
        topic_id = project.get_uid()
        card_uid = card.get_uid()
        column_uid = card.project_column_id.to_short_code() if card.project_column_id else project.ARCHIVE_COLUMN_UID()
        publish_models: list[SocketPublishModel] = [
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:card:deleted:{card_uid}",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:card:deleted:{topic_id}",
                custom_data={
                    "uid": card_uid,
                    "column_uid": column_uid,
                },
            ),
        ]

        SocketPublishService.put_dispather({}, publish_models)

    @staticmethod
    def __get_column_uid(column: Project | ProjectColumn) -> str:
        return column.ARCHIVE_COLUMN_UID() if isinstance(column, Project) else column.get_uid()

    @staticmethod
    def __get_column_name(column: Project | ProjectColumn) -> str:
        return column.archive_column_name if isinstance(column, Project) else column.name
