from typing import (
    Any,
    Callable,
    Concatenate,
    Coroutine,
    Generic,
    ParamSpec,
    Protocol,
    TypeVar,
    cast,
    overload,
)
from pydantic import BaseModel
from ...core.ai.BotType import BotType
from ...core.db import BaseSqlModel, DbSession
from ...core.utils.String import pascal_to_snake
from ...models import Card, Checkitem, Group, Project, ProjectColumn, User, UserActivity
from ...models.BaseActivityModel import ActivityType, BaseActivityModel
from ..BaseService import BaseService
from .RevertService import RevertService, RevertType


_TBaseModel = TypeVar("_TBaseModel", bound=BaseSqlModel)
_TBaseActivityModel = TypeVar("_TBaseActivityModel", bound=BaseActivityModel)
_TActivityMethodParams = ParamSpec("_TActivityMethodParams")
_TActivityMethodReturn = TypeVar("_TActivityMethodReturn", covariant=True)


class _ActivityMethod(Protocol, Generic[_TActivityMethodParams, _TActivityMethodReturn]):
    @overload
    async def __call__(
        self_,  # type: ignore
        *args: _TActivityMethodParams.args,
        **kwargs: _TActivityMethodParams.kwargs,
    ) -> _TActivityMethodReturn: ...
    @overload
    async def __call__(
        self_,  # type: ignore
        self: Any,
        *args: _TActivityMethodParams.args,
        **kwargs: _TActivityMethodParams.kwargs,
    ) -> _TActivityMethodReturn: ...
    async def __call__(  # type: ignore
        self_,  # type: ignore
        self: Any,
        *args: _TActivityMethodParams.args,
        **kwargs: _TActivityMethodParams.kwargs,
    ) -> _TActivityMethodReturn: ...


class ActivityResult(BaseModel):
    user_or_bot: User | BotType
    model: BaseSqlModel
    shared: dict[str, Any]
    new: list[str] | dict[str, Any]
    old: dict[str, Any] | None = None
    revert_key: str | None = None


class ActivityService(BaseService):
    ACTIVITY_TYPES = ActivityType

    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "activity"

    @staticmethod
    def activity_method(activity_class: type[_TBaseActivityModel], activity_type: ActivityType):
        """Decorates a method to record an activity.

        E.g.::

            class ProjectServer(BaseService):
                @ActivityService.activity_method(ProjectActivity, ActivityService.ACTIVITY_TYPES.ProjectCreated)
                async def create_project(self, ...) -> tuple[ActivityResult | None, Project] | None:
                    ...
        """

        def decorator(
            method: Callable[
                Concatenate[Any, _TActivityMethodParams],
                Coroutine[Any, Any, tuple[ActivityResult | None, _TActivityMethodReturn] | None],
            ],
        ) -> _ActivityMethod[_TActivityMethodParams, _TActivityMethodReturn]:
            async def wrapper(self: BaseService, *args, **kwargs):
                activity_result, result = await method(self, *args, **kwargs) or (None, None)
                if activity_result:
                    activities = await ActivityService.__record_activity(
                        self._db, activity_class, activity_type, activity_result
                    )
                    if activity_result.revert_key:
                        revert_service = self._get_service(RevertService)
                        await revert_service.record(
                            *[
                                revert_service.create_record_model(activity, RevertType.Delete)
                                for activity in activities
                            ],
                            revert_key=activity_result.revert_key,
                            only_commit=True,
                        )
                    else:
                        await self._db.commit()
                return result

            return wrapper  # type: ignore

        return decorator

    @staticmethod
    async def __record_activity(
        db: DbSession,
        activity_class: type[_TBaseActivityModel],
        activity_type: ActivityType,
        activity_result: ActivityResult,
    ):
        activity_target = pascal_to_snake(activity_class.__name__).replace("_activity", "")
        activity = {
            "shared": activity_result.shared,
            "old": activity_result.old,
        }
        if isinstance(activity_result.new, list):
            activity["new"] = {field: getattr(activity_result.model, field) for field in activity_result.new}
        else:
            activity["new"] = activity_result.new
        activities = []
        activity_record_params = {
            "activity": activity,
            "activity_type": activity_type,
        }
        if isinstance(activity_result.user_or_bot, User):
            activity_record_params["user_id"] = activity_result.user_or_bot.id
            activities.append(
                await ActivityService.__create_activity(
                    db=db,
                    activity_class=UserActivity,
                    **activity_record_params,
                )
            )
            activity_record_params["user_id"] = cast(int, activity_result.user_or_bot.id)
            activity_record_params["bot_type"] = None
        else:
            activity_record_params["user_id"] = None
            activity_record_params["bot_type"] = activity_result.user_or_bot

        if activity_class.__name__ != UserActivity.__name__:
            activity_record_params[f"{activity_target}_id"] = activity_result.model.id

            activities.append(
                await ActivityService.__create_activity(db=db, activity_class=activity_class, **activity_record_params)
            )

        return activities

    @staticmethod
    async def __create_activity(
        db: DbSession, activity_class: type[_TBaseActivityModel], **kwargs
    ) -> _TBaseActivityModel:
        """Record an activity.

        After the method is executed, db must be committed to save the changes.
        """
        record = activity_class(**kwargs)

        db.insert(record)
        return record

    async def get_activities(
        self, activity_class: type[_TBaseActivityModel], user_id: int, page: int, limit: int, **kwargs
    ) -> list[dict[str, Any]]:
        query = self._db.query("select").table(activity_class)
        query = self._where_recursive(query, activity_class, **{"user_id": user_id, **kwargs})
        query = query.order_by(activity_class.column("created_at").desc(), activity_class.column("id").desc()).group_by(
            activity_class.column("id"), activity_class.column("created_at")
        )
        query = self.paginate(query, page, limit)
        result = await self._db.exec(query)
        raw_activities = result.all()
        activities = []

        cached = {}
        for raw_activity in raw_activities:
            activity = {
                "id": raw_activity.id,
                "activity_type": raw_activity.activity_type.value,
                "activity": raw_activity.activity,
            }

            await self.__transform_activity_shared_data(cached, activity, "user_id", User, "id", "user")
            await self.__transform_activity_shared_data(cached, activity, "user_ids", User, "id", "users")
            await self.__transform_activity_shared_data(cached, activity, "group_id", Group, "id", "group")
            await self.__transform_activity_shared_data(cached, activity, "group_ids", Group, "id", "groups")
            await self.__transform_activity_shared_data(cached, activity, "project_id", Project, "id", "project")
            await self.__transform_activity_shared_data(
                cached, activity, "column_uid", ProjectColumn, "uid", "project_column"
            )
            await self.__transform_activity_shared_data(cached, activity, "card_id", Card, "id", "card")
            await self.__transform_activity_shared_data(cached, activity, "checkitem_id", Checkitem, "id", "checkitem")

            activities.append(activity)
        cached.clear()
        return activities

    async def __transform_activity_shared_data(
        self,
        cached: dict[str, Any],
        activity: dict[str, Any],
        target_key: str,
        target_model: type[_TBaseModel],
        column_name: str,
        transform_key: str,
    ) -> None:
        prefix = ""
        if target_key not in activity["activity"]["shared"]:
            for key in activity["activity"]["shared"]:
                if key.endswith(f"_{target_key}"):
                    prefix = key[: -len(target_key)]
            if not prefix:
                return
        key = f"{prefix}{target_key}"
        target_value = activity["activity"]["shared"][key]
        cached_key = f"{key}_{target_value}"
        if cached_key in cached:
            return cached[cached_key]
        target = await self._get_by(target_model, column_name, target_value)
        if target:
            activity["activity"]["shared"][f"{prefix}{transform_key}"] = target.api_response()
