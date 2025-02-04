from typing import Any, Callable, Coroutine, Generic, TypeVar, cast
from ....core.ai import Bot
from ....core.db import BaseSqlModel, DbSession, SnowflakeID, SqlBuilder, User
from ....models import Card, CardRelationship, GlobalCardRelationshipType, Project, ProjectColumn, ProjectLabel
from ....models.BaseActivityModel import BaseActivityModel
from .ActivityHistoryHelper import ActivityHistoryHelper


_TActivityModel = TypeVar("_TActivityModel", bound=BaseActivityModel)
_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)


class ActivityTaskHelper(Generic[_TActivityModel]):
    def __init__(self, model_class: type[_TActivityModel]):
        self._model_class = model_class

    async def record(self, user_or_bot: User | Bot, activity_history: dict[str, Any], **kwargs) -> _TActivityModel:
        activity_history["recorder"] = ActivityHistoryHelper.create_user_or_bot_history(user_or_bot)

        model = {
            "activity_history": activity_history,
            **kwargs,
        }

        if isinstance(user_or_bot, User):
            model["user_id"] = user_or_bot.id
        else:
            model["bot_id"] = user_or_bot.id

        activity = self._model_class(**model)

        async with DbSession.use() as db:
            db.insert(activity)
            await db.commit()

        return activity

    async def get_updated_bots(self, old_bot_ids: list[int], new_bot_ids: list[int]):
        async def create_bot_history(bot: Bot):
            return ActivityHistoryHelper.create_user_or_bot_history(bot)

        return await self.__get_updated(Bot, old_bot_ids, new_bot_ids, create_bot_history)

    async def get_updated_users(self, old_user_ids: list[int], new_user_ids: list[int]):
        async def create_user_history(user: User):
            return ActivityHistoryHelper.create_user_or_bot_history(user)

        return await self.__get_updated(User, old_user_ids, new_user_ids, create_user_history)

    async def get_updated_labels(self, old_label_ids: list[int], new_label_ids: list[int]):
        async def label_converter(label: ProjectLabel):
            return ActivityHistoryHelper.create_label_history(label)

        return await self.__get_updated(ProjectLabel, old_label_ids, new_label_ids, label_converter)

    async def get_updated_card_relationships(
        self, old_relationship_ids: list[int], new_relationship_ids: list[int], is_parent: bool
    ):
        async def relationship_converter(relationship: CardRelationship):
            async with DbSession.use() as db:
                result = await db.exec(
                    SqlBuilder.select.table(GlobalCardRelationshipType).where(
                        GlobalCardRelationshipType.column("id") == relationship.relationship_type_id
                    )
                )
            global_relationship = cast(GlobalCardRelationshipType, result.first())
            target_card_id = relationship.card_id_parent if is_parent else relationship.card_id_child
            async with DbSession.use() as db:
                result = await db.exec(SqlBuilder.select.table(Card).where(Card.column("id") == target_card_id))
            related_card = cast(Card, result.first())

            return ActivityHistoryHelper.create_card_relationship(global_relationship, related_card, is_parent)

        return await self.__get_updated(
            CardRelationship, old_relationship_ids, new_relationship_ids, relationship_converter
        )

    async def create_project_default_history(self, project: Project, card: Card | None = None):
        history = {
            "project": ActivityHistoryHelper.create_project_history(project),
        }

        if not card:
            return history

        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(ProjectColumn).where(ProjectColumn.column("id") == card.project_column_id)
            )
        column = cast(ProjectColumn, result.first())

        history.update(**ActivityHistoryHelper.create_card_history(card, column))

        return history

    async def __get_updated(
        self,
        model_class: type[_TBaseModel],
        old_ids: list[int],
        new_ids: list[int],
        converter: Callable[[_TBaseModel], Coroutine[Any, Any, dict[str, Any]]],
    ):
        async with DbSession.use() as db:
            result = await db.exec(
                SqlBuilder.select.table(model_class).where(model_class.column("id").in_(set([*old_ids, *new_ids])))
            )
        models = result.all()

        removed_models: dict[SnowflakeID, dict[str, Any]] = {}
        added_models: dict[SnowflakeID, dict[str, Any]] = {}
        for target_model in models:
            in_old, in_new = (target_model.id in old_ids), (target_model.id in new_ids)
            if in_old and in_new:
                continue

            target_model_dict = await converter(target_model)
            if in_old:
                removed_models[target_model.id] = target_model_dict
            elif in_new:
                added_models[target_model.id] = target_model_dict

        return removed_models, added_models
