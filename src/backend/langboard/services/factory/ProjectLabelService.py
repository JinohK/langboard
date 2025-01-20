from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketPublishModel, SocketPublishService
from ...models import Card, CardAssignedProjectLabel, Project, ProjectLabel
from ...tasks import ProjectLabelActivityTask
from .Types import TCardParam, TProjectLabelParam, TProjectParam, TUserOrBot


_SOCKET_PREFIX = "board:label"


class ProjectLabelService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "project_label"

    @overload
    async def get_all(self, project: TProjectParam, as_api: Literal[False]) -> list[ProjectLabel]: ...
    @overload
    async def get_all(self, project: TProjectParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all(self, project: TProjectParam, as_api: bool) -> list[ProjectLabel] | list[dict[str, Any]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectLabel)
            .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("is_bot") == False))  # noqa
            .order_by(ProjectLabel.column("order").asc())
            .group_by(ProjectLabel.column("id"), ProjectLabel.column("order"))
        )
        raw_labels = result.all()
        if not as_api:
            return list(raw_labels)
        return [label.api_response() for label in raw_labels]

    async def get_all_bot(self, project: TProjectParam) -> list[ProjectLabel]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []
        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectLabel)
            .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("is_bot") == True))  # noqa
            .order_by(ProjectLabel.column("order").asc())
            .group_by(ProjectLabel.column("id"), ProjectLabel.column("order"))
        )
        return list(result.all())

    @overload
    async def get_all_by_card(self, card: TCardParam, as_api: Literal[False]) -> list[ProjectLabel]: ...
    @overload
    async def get_all_by_card(self, card: TCardParam, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_card(self, card: TCardParam, as_api: bool) -> list[ProjectLabel] | list[dict[str, Any]]:
        card = cast(Card, await self._get_by_param(Card, card))
        if not card:
            return []

        result = await self._db.exec(
            self._db.query("select")
            .table(ProjectLabel)
            .join(
                CardAssignedProjectLabel,
                ProjectLabel.column("id") == CardAssignedProjectLabel.column("project_label_id"),
            )
            .where(CardAssignedProjectLabel.column("card_id") == card.id)
        )
        raw_labels = result.all()
        if not as_api:
            return list(raw_labels)
        return [label.api_response() for label in raw_labels]

    async def init_defaults(self, project: TProjectParam) -> list[ProjectLabel]:
        project = cast(Project, await self._get_by_param(Project, project))
        labels: list[ProjectLabel] = []
        for default_label in ProjectLabel.DEFAULT_LABELS:
            label = ProjectLabel(
                project_id=project.id,
                name=default_label["name"],
                color=default_label["color"],
                description=default_label["description"],
                order=len(labels),
            )
            labels.append(label)
            self._db.insert(label)
        await self._db.commit()
        return labels

    async def create(
        self, user_or_bot: TUserOrBot, project: TProjectParam, name: str, color: str, description: str
    ) -> tuple[ProjectLabel, dict[str, Any]] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        is_bot = isinstance(user_or_bot, Bot)
        if is_bot:
            max_order = -2  # -1 is for the bot label
        else:
            max_order = await self._get_max_order(ProjectLabel, "project_id", project.id)

        label = ProjectLabel(
            project_id=project.id,
            name=name,
            color=color,
            description=description,
            order=max_order + 1,
            is_bot=is_bot,
        )
        self._db.insert(label)
        await self._db.commit()

        if is_bot:
            return None

        api_label = label.api_response()
        model = {"label": api_label}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:created:{project.get_uid()}",
            data_keys="label",
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectLabelActivityTask.project_label_created(user_or_bot, project, label)

        return label, api_label

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.is_bot and not isinstance(user_or_bot, Bot):
            return None

        old_label_record = {}
        mutable_keys = ["name", "color", "description"]

        for key in mutable_keys:
            if key not in form or not hasattr(label, key):
                continue
            old_value = getattr(label, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_label_record[key] = self._convert_to_python(old_value)
            setattr(label, key, new_value)

        if not old_label_record:
            return True

        await self._db.update(label)
        await self._db.commit()

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_label_record:
                continue
            model[key] = self._convert_to_python(getattr(label, key))

        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:details:changed:{label.get_uid()}",
            data_keys=list(model.keys()),
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectLabelActivityTask.project_label_updated(user_or_bot, project, old_label_record, label)

        return model

    async def change_order(
        self, user: User, project: TProjectParam, label: TProjectLabelParam, order: int
    ) -> Literal[True] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.is_bot:
            return None

        original_order = label.order
        update_query = (
            self._db.query("update")
            .table(ProjectLabel)
            .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("is_bot") == False))  # noqa
        )
        update_query = self._set_order_in_column(update_query, ProjectLabel, original_order, order)
        await self._db.exec(update_query)

        label.order = order
        await self._db.update(label)
        await self._db.commit()

        model = {"uid": label.get_uid(), "order": order}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:order:changed:{project.get_uid()}",
            data_keys=["uid", "order"],
        )

        SocketPublishService.put_dispather(model, publish_model)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam) -> bool | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.is_bot and not isinstance(user_or_bot, Bot):
            return None

        await self._db.delete(label)
        await self._db.commit()

        model = {"uid": label.get_uid()}
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:deleted:{project.get_uid()}",
            data_keys="uid",
        )

        SocketPublishService.put_dispather(model, publish_model)

        ProjectLabelActivityTask.project_label_deleted(user_or_bot, project, label)

        return True

    async def __get_records_by_params(self, project: TProjectParam, label: TProjectLabelParam):
        project = cast(Project, await self._get_by_param(Project, project))
        label = cast(ProjectLabel, await self._get_by_param(ProjectLabel, label))
        if not project or not label or label.project_id != project.id:
            return None

        return project, label
