from datetime import datetime
from typing import Any, Literal, TypeVar, cast, overload
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.ai import Bot
from ...core.db import DbSession, SqlBuilder, User
from ...core.schema import Pagination
from ...core.service import BaseService, ServiceHelper
from ...models import Card, Project, ProjectActivity, ProjectWiki, ProjectWikiActivity, UserActivity
from ...models.BaseActivityModel import BaseActivityModel
from .Types import TBotParam, TCardParam, TProjectParam, TUserParam, TWikiParam


_TActivityModel = TypeVar("_TActivityModel", bound=BaseActivityModel)
_TSelectParam = TypeVar("_TSelectParam", bound=Any)


class ActivityService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "activity"

    @overload
    async def get_list_by_user(
        self, user: TUserParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], int, User] | None: ...
    @overload
    async def get_list_by_user(
        self, user: TUserParam, pagination: Pagination, refer_time: datetime, only_count: Literal[True]
    ) -> int | None: ...
    async def get_list_by_user(
        self, user: TUserParam, pagination: Pagination, refer_time: datetime, only_count: bool = False
    ) -> tuple[list[dict[str, Any]], int, User] | int | None:
        user = cast(User, await ServiceHelper.get_by_param(User, user))
        if not user:
            return []

        if only_count:
            return await self.__count_new_records(UserActivity, refer_time, user_id=user.id)

        activities, count_new_records = await self.__get_list(UserActivity, pagination, refer_time, user_id=user.id)
        api_activties = []
        cached_dict = await self.__get_cached_references(activities)
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            if activity.id not in cached_dict:
                continue

            api_activity = {
                **activity.api_response(),
                **cached_dict[activity.id],
            }
            api_activties.append(api_activity)

        return api_activties, count_new_records, user

    @overload
    async def get_list_by_project_assignee(
        self, project: TProjectParam, assignee: TUserParam | TBotParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], int, User | Bot] | None: ...
    @overload
    async def get_list_by_project_assignee(
        self,
        project: TProjectParam,
        assignee: TUserParam | TBotParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: Literal[True],
    ) -> int | None: ...
    async def get_list_by_project_assignee(
        self,
        project: TProjectParam,
        assignee: TUserParam | TBotParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: bool = False,
    ) -> tuple[list[dict[str, Any]], int, User | Bot] | int | None:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        assignee = cast(User, await ServiceHelper.get_by_param(User, assignee))
        if not assignee:
            assignee = cast(Bot, await ServiceHelper.get_by_param(Bot, assignee))
            if not assignee:
                return None

        if not project or not assignee:
            return None

        list_query = self.__refer_project(SqlBuilder.select.table(UserActivity), project)
        outdated_query = self.__refer_project(SqlBuilder.select.count(UserActivity, UserActivity.column("id")), project)
        where_clauses = {}

        if isinstance(assignee, User):
            where_clauses["user_id"] = assignee.id
        else:
            where_clauses["bot_id"] = assignee.id

        if only_count:
            return await self.__count_new_records(UserActivity, refer_time, outdated_query, **where_clauses)

        activities, count_new_records = await self.__get_list(
            UserActivity, pagination, refer_time, list_query, outdated_query, **where_clauses
        )
        api_activties = []
        cached_dict = await self.__get_cached_references(activities)
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            if activity.id not in cached_dict:
                continue

            api_activity = {
                **activity.api_response(),
                **cached_dict[activity.id],
            }
            api_activties.append(api_activity)

        return api_activties, count_new_records, assignee

    @overload
    async def get_list_by_project(
        self, project: TProjectParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], int, Project] | None: ...
    @overload
    async def get_list_by_project(
        self, project: TProjectParam, pagination: Pagination, refer_time: datetime, only_count: Literal[True]
    ) -> int | None: ...
    async def get_list_by_project(
        self, project: TProjectParam, pagination: Pagination, refer_time: datetime, only_count: bool = False
    ) -> tuple[list[dict[str, Any]], int, Project] | int | None:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        if not project:
            return None

        if only_count:
            return await self.__count_new_records(ProjectActivity, refer_time, project_id=project.id)

        activities, count_new_records = await self.__get_list(
            ProjectActivity, pagination, refer_time, project_id=project.id
        )
        return [activity.api_response() for activity in activities], count_new_records, project

    @overload
    async def get_list_by_card(
        self, project: TProjectParam, card: TCardParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | None: ...
    @overload
    async def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: Literal[True],
    ) -> int: ...
    async def get_list_by_card(
        self,
        project: TProjectParam,
        card: TCardParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: bool = False,
    ) -> tuple[list[dict[str, Any]], int, Project, Card] | int | None:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        card = cast(Card, await ServiceHelper.get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        if only_count:
            return await self.__count_new_records(ProjectActivity, refer_time, project_id=project.id, card_id=card.id)

        activities, count_new_records = await self.__get_list(
            ProjectActivity, pagination, refer_time, project_id=project.id, card_id=card.id
        )
        return [activity.api_response() for activity in activities], count_new_records, project, card

    @overload
    async def get_list_by_wiki(
        self, project: TProjectParam, wiki: TWikiParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | None: ...
    @overload
    async def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: Literal[True],
    ) -> int | None: ...
    async def get_list_by_wiki(
        self,
        project: TProjectParam,
        wiki: TWikiParam,
        pagination: Pagination,
        refer_time: datetime,
        only_count: bool = False,
    ) -> tuple[list[dict[str, Any]], int, Project, ProjectWiki] | int | None:
        project = cast(Project, await ServiceHelper.get_by_param(Project, project))
        wiki = cast(ProjectWiki, await ServiceHelper.get_by_param(ProjectWiki, wiki))
        if not project or not wiki or wiki.project_id != project.id:
            return None

        if only_count:
            return await self.__count_new_records(
                ProjectWikiActivity, refer_time, project_id=project.id, project_wiki_id=wiki.id
            )

        activities, count_new_records = await self.__get_list(
            ProjectWikiActivity, pagination, refer_time, project_id=project.id, project_wiki_id=wiki.id
        )
        return [activity.api_response() for activity in activities], count_new_records, project, wiki

    async def __get_cached_references(self, activities: list[UserActivity]):
        refer_activities = await ServiceHelper.get_references(
            [
                (activity.refer_activity_table, activity.refer_activity_id)
                for activity in activities
                if activity.refer_activity_table and activity.refer_activity_id
            ],
            as_type="raw",
        )
        refer_activity_reference_ids: list[tuple[str, int]] = []
        for refer_activity in refer_activities.values():
            if isinstance(refer_activity, ProjectActivity):
                refer_activity_reference_ids.append((Project.__tablename__, refer_activity.project_id))
                if refer_activity.card_id:
                    refer_activity_reference_ids.append((Card.__tablename__, refer_activity.card_id))
            elif isinstance(refer_activity, ProjectWikiActivity):
                refer_activity_reference_ids.append((Project.__tablename__, refer_activity.project_id))
                refer_activity_reference_ids.append((ProjectWiki.__tablename__, refer_activity.project_wiki_id))

        cached_references = await ServiceHelper.get_references(refer_activity_reference_ids, as_type="raw")
        references = {}
        for activity in activities:
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            refer_activitiy_cache_key = f"{activity.refer_activity_table}_{activity.refer_activity_id}"
            if refer_activitiy_cache_key not in refer_activities:
                continue

            refer_activity = refer_activities[refer_activitiy_cache_key]
            activity_references = {}
            if isinstance(refer_activity, ProjectActivity) and refer_activity.project_id:
                activity_references["refer_type"] = "project"
                refer_activity_reference = cached_references.get(f"{Project.__tablename__}_{refer_activity.project_id}")
                if not refer_activity_reference:
                    continue
                activity_references["project"] = refer_activity_reference
                if refer_activity.card_id:
                    refer_activity_reference = cached_references.get(f"{Card.__tablename__}_{refer_activity.card_id}")
                    if not refer_activity_reference:
                        continue
                    activity_references["card"] = refer_activity_reference
            elif isinstance(refer_activity, ProjectWikiActivity):
                activity_references["refer_type"] = "project_wiki"
                refer_activity_reference = cached_references.get(f"{Project.__tablename__}_{refer_activity.project_id}")
                if not refer_activity_reference:
                    continue
                activity_references["project"] = refer_activity_reference
                refer_activity_reference = cached_references.get(
                    f"{ProjectWiki.__tablename__}_{refer_activity.project_wiki_id}"
                )
                if not refer_activity_reference:
                    continue
                activity_references["project_wiki"] = refer_activity_reference

            references[activity.id] = {"refer": refer_activity.api_response(), "references": activity_references}
        return references

    async def __get_list(
        self,
        activity_class: type[_TActivityModel],
        pagination: Pagination,
        refer_time: datetime,
        list_query: Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | None = None,
        outdated_query: SelectOfScalar[int] | None = None,
        **where_clauses,
    ) -> tuple[list[_TActivityModel], int]:
        if list_query is None:
            list_query = SqlBuilder.select.table(activity_class)
        list_query = self.__make_query(list_query, activity_class, **where_clauses)
        list_query = list_query.where(activity_class.column("created_at") <= refer_time)
        list_query = ServiceHelper.paginate(list_query, pagination.page, pagination.limit)
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(list_query)
        result_list = result.all()

        count_new_records = await self.__count_new_records(activity_class, refer_time, outdated_query, **where_clauses)

        return list(result_list), count_new_records

    async def __count_new_records(
        self,
        activity_class: type[_TActivityModel],
        refer_time: datetime,
        outdated_query: SelectOfScalar[int] | None = None,
        **where_clauses,
    ) -> int:
        if outdated_query is None:
            outdated_query = SqlBuilder.select.count(activity_class, activity_class.column("id"))
        outdated_query = self.__make_query(outdated_query, activity_class, **where_clauses)
        outdated_query = outdated_query.where(activity_class.column("created_at") > refer_time)
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(outdated_query)
        return result.first() or 0

    @overload
    def __make_query(
        self, query: Select[_TSelectParam], activity_class: type[_TActivityModel], **where_clauses
    ) -> Select[_TSelectParam]: ...
    @overload
    def __make_query(
        self, query: SelectOfScalar[_TSelectParam], activity_class: type[_TActivityModel], **where_clauses
    ) -> SelectOfScalar[_TSelectParam]: ...
    def __make_query(
        self,
        query: Select[_TSelectParam] | SelectOfScalar[_TSelectParam],
        activity_class: type[_TActivityModel],
        **where_clauses,
    ):
        query = query.order_by(activity_class.column("created_at").desc()).group_by(
            activity_class.column("id"), activity_class.column("created_at")
        )
        query = ServiceHelper.where_recursive(query, activity_class, **where_clauses)
        return query

    @overload
    def __refer_project(self, query: Select[_TActivityModel], project: Project) -> Select[_TActivityModel]: ...
    @overload
    def __refer_project(
        self, query: SelectOfScalar[_TActivityModel], project: Project
    ) -> SelectOfScalar[_TActivityModel]: ...
    @overload
    def __refer_project(self, query: SelectOfScalar[int], project: Project) -> SelectOfScalar[int]: ...
    def __refer_project(
        self, query: Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | SelectOfScalar[int], project: Project
    ) -> Select[_TActivityModel] | SelectOfScalar[_TActivityModel] | SelectOfScalar[int]:
        return (
            query.outerjoin(
                ProjectActivity,
                (UserActivity.column("refer_activity_table") == ProjectActivity.__tablename__)
                & (ProjectActivity.column("id") == UserActivity.column("refer_activity_id")),
            )
            .outerjoin(
                ProjectWikiActivity,
                (UserActivity.column("refer_activity_table") == ProjectWikiActivity.__tablename__)
                & (ProjectWikiActivity.column("id") == UserActivity.column("refer_activity_id")),
            )
            .where(
                (ProjectActivity.column("project_id") == project.id)
                | (ProjectWikiActivity.column("project_id") == project.id)
            )
        )
