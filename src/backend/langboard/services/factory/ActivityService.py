from datetime import datetime
from typing import Any, TypeVar, cast
from ...core.db import User
from ...core.schema import Pagination
from ...core.service import BaseService
from ...models import Card, Project, ProjectActivity, ProjectWiki, ProjectWikiActivity, UserActivity
from ...models.BaseActivityModel import BaseActivityModel
from .Types import TCardParam, TProjectParam, TUserParam, TWikiParam


_TActivityModel = TypeVar("_TActivityModel", bound=BaseActivityModel)


class ActivityService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "activity"

    async def get_list_by_user(
        self, user: TUserParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], bool, User] | None:
        user = cast(User, await self._get_by_param(User, user))
        if not user:
            return []

        activities, is_outdated = await self.__get_list(UserActivity, pagination, refer_time, user_id=user.id)
        api_user_activties = []
        for user_activity in activities:
            api_user_activity = user_activity.api_response()
            if not user_activity.refer_activity_id or not user_activity.refer_activity_table:
                continue

            model_class = cast(
                type[BaseActivityModel], self._get_model_by_table_name(user_activity.refer_activity_table)
            )
            if not model_class:
                continue

            model = await self._get_by(model_class, "id", user_activity.refer_activity_id)
            if not model:
                continue

            references = await self.__get_refer_record(model)
            if not references:
                continue

            api_user_activity["refer"] = model.api_response()
            api_user_activity["references"] = references
            api_user_activties.append(api_user_activity)

        return api_user_activties, is_outdated, user

    async def get_list_by_project(
        self, project: TProjectParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], bool, Project] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        if not project:
            return None

        activities, is_outdated = await self.__get_list(ProjectActivity, pagination, refer_time, project_id=project.id)
        return [activity.api_response() for activity in activities], is_outdated, project

    async def get_list_by_card(
        self, project: TProjectParam, card: TCardParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], bool, Project, Card] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        card = cast(Card, await self._get_by_param(Card, card))
        if not project or not card or card.project_id != project.id:
            return None

        activities, is_outdated = await self.__get_list(
            ProjectActivity, pagination, refer_time, project_id=project.id, card_id=card.id
        )
        return [activity.api_response() for activity in activities], is_outdated, project, card

    async def get_list_by_wiki(
        self, project: TProjectParam, wiki: TWikiParam, pagination: Pagination, refer_time: datetime
    ) -> tuple[list[dict[str, Any]], bool, Project, ProjectWiki] | None:
        project = cast(Project, await self._get_by_param(Project, project))
        wiki = cast(ProjectWiki, await self._get_by_param(Card, wiki))
        if not project or not wiki or wiki.project_id != project.id:
            return None

        activities, is_outdated = await self.__get_list(
            ProjectActivity, pagination, refer_time, project_id=project.id, project_wiki_id=wiki.id
        )
        return [activity.api_response() for activity in activities], is_outdated, project, wiki

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
                "project": project.api_response(),
                "card": card.api_response() if card else None,
            }
        elif isinstance(model, ProjectWikiActivity):
            project = await self._get_by(Project, "id", model.project_id, with_deleted=True)
            wiki = await self._get_by(ProjectWiki, "id", model.project_wiki_id, with_deleted=True)
            if not project or not wiki:
                return None
            return {
                "refer_type": "project_wiki",
                "project": project.api_response(),
                "project_wiki": wiki.api_response(),
            }

    async def __get_list(
        self,
        activity_class: type[_TActivityModel],
        pagination: Pagination,
        refer_time: datetime,
        **where_clauses,
    ):
        shared_query = (
            self._db.query("select")
            .table(activity_class)
            .order_by(activity_class.column("created_at").desc())
            .group_by(activity_class.column("id"), activity_class.column("created_at"))
        )
        shared_query = self._where_recursive(shared_query, activity_class, **where_clauses)
        list_query = shared_query.where((activity_class.column("created_at") <= refer_time))
        list_query = self.paginate(list_query, pagination.page, pagination.limit)
        result = await self._db.exec(list_query)
        result_list = result.all()

        outdated_query = shared_query.where((activity_class.column("created_at") > refer_time))
        result = await self._db.exec(outdated_query)
        is_outdated = len(result.all()) > 0

        return result_list, is_outdated
