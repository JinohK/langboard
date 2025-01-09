from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import User
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...models import Card, CardAssignedProjectLabel, Project, ProjectLabel
from .RevertService import RevertService, RevertType
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
    ) -> SocketModelIdBaseResult[tuple[ProjectLabel, dict[str, Any]]] | None:
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

        model = label.api_response()
        model_id = await SocketModelIdService.create_model_id({"label": model})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:created:{project.get_uid()}",
            data_keys="label",
        )

        return SocketModelIdBaseResult(model_id, (label, model), publish_model)

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam, form: dict
    ) -> SocketModelIdBaseResult[tuple[str | None, dict[str, Any]]] | Literal[True] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

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

        if isinstance(user_or_bot, Bot):
            await self._db.update(label)
            await self._db.commit()
            revert_key = None
        else:
            revert_service = self._get_service(RevertService)
            revert_key = await revert_service.record(revert_service.create_record_model(label, RevertType.Update))

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_label_record:
                continue
            model[key] = self._convert_to_python(getattr(label, key))
        model_id = await SocketModelIdService.create_model_id(model)

        topic_id = project.get_uid()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"{_SOCKET_PREFIX}:details:changed:{label.get_uid()}",
            data_keys=list(model.keys()),
        )

        return SocketModelIdBaseResult(model_id, (revert_key, model), publish_model)

    async def change_order(
        self, user: User, project: TProjectParam, label: TProjectLabelParam, order: int
    ) -> SocketModelIdBaseResult[bool] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        original_order = label.order
        update_query = (
            self._db.query("update")
            .table(ProjectLabel)
            .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("is_bot") == False))  # noqa
        )
        if original_order < order:
            update_query = update_query.values({ProjectLabel.order: ProjectLabel.order - 1}).where(
                (ProjectLabel.column("order") <= order) & (ProjectLabel.column("order") > original_order)
            )
        else:
            update_query = update_query.values({ProjectLabel.order: ProjectLabel.order + 1}).where(
                (ProjectLabel.column("order") >= order) & (ProjectLabel.column("order") < original_order)
            )
        await self._db.exec(update_query)

        label.order = order
        await self._db.update(label)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id({"uid": label.get_uid(), "order": order})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:order:changed:{project.get_uid()}",
            data_keys=["uid", "order"],
        )

        return SocketModelIdBaseResult(model_id, True, publish_model)

    async def delete(
        self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam
    ) -> SocketModelIdBaseResult[bool] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        await self._db.delete(label)
        await self._db.commit()

        model_id = await SocketModelIdService.create_model_id({"uid": label.get_uid()})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=project.get_uid(),
            event=f"{_SOCKET_PREFIX}:deleted:{project.get_uid()}",
            data_keys="uid",
        )

        return SocketModelIdBaseResult(model_id, True, publish_model)

    async def __get_records_by_params(self, project: TProjectParam, label: TProjectLabelParam):
        project = cast(Project, await self._get_by_param(Project, project))
        label = cast(ProjectLabel, await self._get_by_param(ProjectLabel, label))
        if not project or not label or label.project_id != project.id:
            return None

        return project, label
