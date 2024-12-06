from datetime import datetime
from typing import (
    Any,
    Callable,
    Concatenate,
    Coroutine,
    Generic,
    Literal,
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
from ...models import Card, CardComment, Checkitem, Project, ProjectColumn, User, UserActivity
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

    @overload
    @staticmethod
    def activity_method(
        activity_class: type[_TBaseActivityModel], activity_type: ActivityType
    ) -> Callable[
        [
            Callable[
                Concatenate[Any, _TActivityMethodParams],
                Coroutine[Any, Any, tuple[ActivityResult | None, _TActivityMethodReturn] | None],
            ]
        ],
        _ActivityMethod[_TActivityMethodParams, _TActivityMethodReturn],
    ]: ...
    @overload
    @staticmethod
    def activity_method(
        activity_class: type[_TBaseActivityModel], activity_type: ActivityType, no_user_activity: Literal[False]
    ) -> Callable[
        [
            Callable[
                Concatenate[Any, _TActivityMethodParams],
                Coroutine[Any, Any, tuple[ActivityResult | None, _TActivityMethodReturn] | None],
            ]
        ],
        _ActivityMethod[_TActivityMethodParams, _TActivityMethodReturn],
    ]: ...
    @overload
    @staticmethod
    def activity_method(
        activity_class: type[_TBaseActivityModel], activity_type: ActivityType, no_user_activity: Literal[True]
    ) -> Callable[
        [
            Callable[
                Concatenate[_TActivityMethodParams],
                Coroutine[Any, Any, tuple[ActivityResult | None, _TActivityMethodReturn] | None],
            ]
        ],
        _ActivityMethod[_TActivityMethodParams, _TActivityMethodReturn],
    ]: ...
    @staticmethod
    def activity_method(  # type: ignore
        activity_class: type[_TBaseActivityModel], activity_type: ActivityType, no_user_activity: bool = False
    ):
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
                        self._db, activity_class, activity_type, activity_result, no_user_activity
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
        no_user_activity: bool,
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

        for key in activity["new"]:
            if isinstance(activity["new"][key], BaseModel):
                activity["new"][key] = activity["new"][key].model_dump()
            elif isinstance(activity["new"][key], datetime):
                activity["new"][key] = activity["new"][key].isoformat()

        activities = []
        activity_record_params = {
            "activity": activity,
            "activity_type": activity_type,
        }
        if isinstance(activity_result.user_or_bot, User):
            activity_record_params["user_id"] = cast(int, activity_result.user_or_bot.id)
            activity_record_params["bot_type"] = None
            if not no_user_activity:
                activities.append(
                    await ActivityService.__create_activity(
                        db=db,
                        activity_class=UserActivity,
                        **activity_record_params,
                    )
                )
        else:
            activity_record_params["user_id"] = None
            activity_record_params["bot_type"] = activity_result.user_or_bot

        if activity_class.__name__ != UserActivity.__name__:
            if activity_result.model.__class__.__name__ == activity_class.__name__.replace("Activity", ""):
                activity_record_params[f"{activity_target}_id"] = activity_result.model.id
            else:
                if f"{activity_target}_id" in activity_result.shared:
                    activity_record_params[f"{activity_target}_id"] = activity_result.shared[f"{activity_target}_id"]
                elif hasattr(activity_result.model, f"{activity_target}_id"):
                    activity_record_params[f"{activity_target}_id"] = getattr(
                        activity_result.model, f"{activity_target}_id"
                    )

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
        self, activity_class: type[_TBaseActivityModel], user_id: int | None, page: int, limit: int, **kwargs
    ) -> list[dict[str, Any]]:
        query = self._db.query("select").table(activity_class)
        where_clauses = {**kwargs}
        if user_id:
            where_clauses["user_id"] = user_id
        query = self._where_recursive(query, activity_class, **where_clauses)
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

            await self.__transform_activity_shared_data(cached, activity, "user_ids", User, "id", "users")
            await self.__transform_activity_shared_data(cached, activity, "user_id", User, "id", "user")
            await self.__transform_activity_shared_data(cached, activity, "project_id", Project, "id", "project")
            await self.__transform_activity_shared_data(
                cached, activity, "column_uids", ProjectColumn, "uid", "project_column"
            )
            await self.__transform_activity_shared_data(
                cached, activity, "column_uid", ProjectColumn, "uid", "project_column"
            )
            await self.__transform_activity_shared_data(cached, activity, "card_ids", Card, "id", "card")
            await self.__transform_activity_shared_data(cached, activity, "card_id", Card, "id", "card")
            await self.__transform_activity_shared_data(cached, activity, "checkitem_ids", Checkitem, "id", "checkitem")
            await self.__transform_activity_shared_data(cached, activity, "checkitem_id", Checkitem, "id", "checkitem")
            await self.__transform_activity_shared_data(cached, activity, "comment_ids", CardComment, "id", "comment")
            await self.__transform_activity_shared_data(cached, activity, "comment_id", CardComment, "id", "comment")

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
        target_value = activity["activity"]["shared"].pop(key)
        cached_key = f"{key}_{target_value}"
        if cached_key in cached:
            return cached[cached_key]

        if isinstance(target_value, list):
            if target_value:
                target = await self._get_all_by(target_model, column_name, target_value)
                activity["activity"]["shared"][f"{prefix}{transform_key}"] = [item.api_response() for item in target]
        else:
            target = await self._get_by(target_model, column_name, target_value)
            activity["activity"]["shared"][f"{prefix}{transform_key}"] = target.api_response() if target else None
