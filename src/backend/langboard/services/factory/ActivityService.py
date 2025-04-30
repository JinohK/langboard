from datetime import datetime
from typing import Any, Literal, TypeVar, cast, overload
from sqlmodel.sql.expression import Select, SelectOfScalar
from ...core.ai import Bot
from ...core.db import DbSession, SqlBuilder, User
from ...core.schema import Pagination
from ...core.service import BaseService
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
        user = cast(User, await self._get_by_param(User, user))
        if not user:
            return []

        if only_count:
            return await self.__count_new_records(UserActivity, refer_time, user_id=user.id)

        activities, count_new_records = await self.__get_list(UserActivity, pagination, refer_time, user_id=user.id)
        api_user_activties = []
        for user_activity in activities:
            api_user_activity = user_activity.api_response()
            if not user_activity.refer_activity_id or not user_activity.refer_activity_table:
                continue

            model = await self.get_record_by_table_name_with_id(
                user_activity.refer_activity_table, user_activity.refer_activity_id
            )
            if not model:
                continue

            references = await self.__get_refer_record(cast(BaseActivityModel, model))
            if not references:
                continue

            api_user_activity["refer"] = model.api_response()
            api_user_activity["references"] = references
            api_user_activties.append(api_user_activity)

        return api_user_activties, count_new_records, user

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
        project = cast(Project, await self._get_by_param(Project, project))
        assignee = cast(User, await self._get_by_param(User, assignee))
        if not assignee:
            assignee = cast(Bot, await self._get_by_param(Bot, assignee))
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
        for activity in activities:
            api_activity = activity.api_response()
            if not activity.refer_activity_id or not activity.refer_activity_table:
                continue

            model = await self.get_record_by_table_name_with_id(
                activity.refer_activity_table, activity.refer_activity_id
            )
            if not model:
                continue

            references = await self.__get_refer_record(cast(BaseActivityModel, model))
            if not references:
                continue

            api_activity["refer"] = model.api_response()
            api_activity["references"] = references
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
        project = cast(Project, await self._get_by_param(Project, project))
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
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
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
        project = cast(Project, await self._get_by_param(Project, project))
        wiki = cast(ProjectWiki, await self._get_by_param(ProjectWiki, wiki))
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

    async def __get_refer_record(self, model: _TActivityModel):  # type: ignore
        if isinstance(model, ProjectActivity):
            project = await self._get_by(Project, "id", model.project_id, with_deleted=True)
            if not project:
                return None
            card = None
            if model.card_id:
                card = await self._get_by(Card, "id", model.card_id, with_deleted=True)
                if not card:
                    return None
            return {
                "refer_type": "project",
                "project": {"uid": project.get_uid()},
                "card": {"uid": card.get_uid()} if card else None,
            }
        elif isinstance(model, ProjectWikiActivity):
            project = await self._get_by(Project, "id", model.project_id, with_deleted=True)
            wiki = await self._get_by(ProjectWiki, "id", model.project_wiki_id, with_deleted=True)
            if not project or not wiki:
                return None
            return {
                "refer_type": "project_wiki",
                "project": {"uid": project.get_uid()},
                "project_wiki": {"uid": wiki.get_uid()},
            }

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
        list_query = self.paginate(list_query, pagination.page, pagination.limit)
        async with DbSession.use() as db:
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
        async with DbSession.use() as db:
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
        query = self._where_recursive(query, activity_class, **where_clauses)
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
