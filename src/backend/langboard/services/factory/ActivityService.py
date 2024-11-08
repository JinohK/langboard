from typing import Any, Callable, Concatenate, Coroutine, Generic, ParamSpec, Protocol, TypeVar, cast, overload
from pydantic import BaseModel
from sqlmodel.sql.expression import SelectOfScalar
from ...core.ai.BotType import BotType
from ...core.db import BaseSqlModel, DbSession
from ...core.utils.String import pascal_to_snake
from ...models import User, UserActivity
from ...models.BaseActivityModel import ActivityType, BaseActivityModel
from ..BaseService import BaseService
from .GroupService import GroupService
from .RevertService import RevertService, RevertType
from .UserService import UserService


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
        query: SelectOfScalar[_TBaseActivityModel] = self.__get_activities_query(
            activity_class=activity_class, user_id=user_id, **kwargs
        )
        query = query.order_by(activity_class.column("created_at").desc(), activity_class.column("id").desc()).group_by(
            activity_class.column("id"), activity_class.column("created_at")
        )
        query = self.paginate(query, page, limit)
        result = await self._db.exec(query)
        raw_activities = result.all()
        activities = []

        user_service = self._get_service(UserService)
        group_service = self._get_service(GroupService)

        for raw_activity in raw_activities:
            activity = {
                "activity_type": raw_activity.activity_type.value,
                "activity": raw_activity.activity,
            }

            if "user_id" in raw_activity.activity["shared"]:
                user_id = raw_activity.activity["shared"]["user_id"]
                user = await user_service.get_by_id(user_id)
                if user:
                    activity["activity"]["shared"]["user"] = user.api_response()

            if "user_ids" in raw_activity.activity["shared"]:
                user_ids = raw_activity.activity["shared"]["user_ids"]
                raw_users = await user_service.get_all_by_ids(user_ids)
                users = []
                for raw_user in raw_users:
                    users.append(raw_user.api_response())
                activity["activity"]["shared"]["users"] = users

            if "group_id" in raw_activity.activity["shared"]:
                group = await group_service.get_by_id(raw_activity.activity["shared"]["group_id"])
                if group:
                    activity["activity"]["shared"]["group"] = group.api_response()

            if "group_ids" in raw_activity.activity["shared"]:
                group_ids = raw_activity.activity["shared"]["group_ids"]
                raw_groups = await group_service.get_all_by_ids(group_ids)
                groups = []
                for raw_group in raw_groups:
                    groups.append(raw_group.api_response())
                activity["activity"]["shared"]["groups"] = groups
            activities.append(activity)
        return activities

    def __get_activities_query(self, activity_class: type[_TBaseActivityModel], **kwargs):
        """Get activities by filtering with the given parameters.

        If the given parameters are not in the model's fields or are `None`, they will be ignored.

        If no parameters are given, all activities will be returned.
        """
        query = self._db.query("select").table(activity_class)

        for arg, value in kwargs.items():
            if arg in activity_class.model_fields and value is not None:
                query = query.where(getattr(activity_class, arg) == value)

        return query
