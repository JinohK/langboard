from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import DbSession, SqlBuilder, User
from ...core.service import BaseService
from ...core.utils.Converter import convert_python_data
from ...models import Card, CardAssignedProjectLabel, Project, ProjectLabel
from ...publishers import ProjectLabelPublisher
from ...tasks.activities import ProjectLabelActivityTask
from ...tasks.bot import ProjectLabelBotTask
from .Types import TCardParam, TProjectLabelParam, TProjectParam, TUserOrBot


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
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") == None))  # noqa
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
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectLabel)
                .where((ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") != None))  # noqa
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

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectLabel)
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

    async def get_all_card_labels_by_project(
        self, project: TProjectParam
    ) -> list[tuple[ProjectLabel, CardAssignedProjectLabel]]:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return []

        async with DbSession.use(readonly=True) as db:
            result = await db.exec(
                SqlBuilder.select.tables(ProjectLabel, CardAssignedProjectLabel)
                .join(
                    CardAssignedProjectLabel,
                    ProjectLabel.column("id") == CardAssignedProjectLabel.column("project_label_id"),
                )
                .where(ProjectLabel.column("project_id") == project.id)
            )
        raw_labels = result.all()
        return list(raw_labels)

    async def init_defaults(self, project: TProjectParam) -> list[ProjectLabel]:
        project = cast(Project, await self._get_by_param(Project, project))
        labels: list[ProjectLabel] = []
        async with DbSession.use(readonly=False) as db:
            for default_label in ProjectLabel.DEFAULT_LABELS:
                label = ProjectLabel(
                    project_id=project.id,
                    name=default_label["name"],
                    color=default_label["color"],
                    description=default_label["description"],
                    order=len(labels),
                )
                labels.append(label)
                await db.insert(label)

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
            bot_id=user_or_bot.id if is_bot else None,
            name=name,
            color=color,
            description=description,
            order=max_order + 1,
        )
        async with DbSession.use(readonly=False) as db:
            await db.insert(label)

        if not is_bot:
            ProjectLabelPublisher.created(project, label)
            ProjectLabelActivityTask.project_label_created(user_or_bot, project, label)
            ProjectLabelBotTask.project_label_created(user_or_bot, project, label)

        return label, label.api_response()

    async def update(
        self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam, form: dict
    ) -> dict[str, Any] | Literal[True] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.bot_id and not isinstance(user_or_bot, Bot):
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
            old_label_record[key] = convert_python_data(old_value)
            setattr(label, key, new_value)

        if not old_label_record:
            return True

        async with DbSession.use(readonly=False) as db:
            await db.update(label)

        model: dict[str, Any] = {}
        for key in mutable_keys:
            if key not in form or key not in old_label_record:
                continue
            model[key] = convert_python_data(getattr(label, key))

        ProjectLabelPublisher.updated(project, label, model)
        ProjectLabelActivityTask.project_label_updated(user_or_bot, project, old_label_record, label)
        ProjectLabelBotTask.project_label_updated(user_or_bot, project, label)

        return model

    async def change_order(
        self, user: User, project: TProjectParam, label: TProjectLabelParam, order: int
    ) -> Literal[True] | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.bot_id:
            return None

        original_order = label.order
        update_query = SqlBuilder.update.table(ProjectLabel).where(
            (ProjectLabel.column("project_id") == project.id) & (ProjectLabel.column("bot_id") == None)  # noqa
        )
        update_query = self._set_order_in_column(update_query, ProjectLabel, original_order, order)
        async with DbSession.use(readonly=False) as db:
            await db.exec(update_query)
            label.order = order
            await db.update(label)

        ProjectLabelPublisher.order_changed(project, label)

        return True

    async def delete(self, user_or_bot: TUserOrBot, project: TProjectParam, label: TProjectLabelParam) -> bool | None:
        params = await self.__get_records_by_params(project, label)
        if not params:
            return None
        project, label = params

        if label.bot_id and not isinstance(user_or_bot, Bot):
            return None

        async with DbSession.use(readonly=False) as db:
            await db.delete(label)

        ProjectLabelPublisher.deleted(project, label)
        ProjectLabelActivityTask.project_label_deleted(user_or_bot, project, label)
        ProjectLabelBotTask.project_label_deleted(user_or_bot, project, label)

        return True

    async def __get_records_by_params(self, project: TProjectParam, label: TProjectLabelParam):
        project = cast(Project, await self._get_by_param(Project, project))
        label = cast(ProjectLabel, await self._get_by_param(ProjectLabel, label))
        if not project or not label or label.project_id != project.id:
            return None

        return project, label
