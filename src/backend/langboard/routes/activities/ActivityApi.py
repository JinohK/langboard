from core.filter import AuthFilter
from core.routing import AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Depends
from models import ProjectActivity, ProjectRole, ProjectWikiActivity, User, UserActivity
from models.BaseActivityModel import BaseActivityModel
from models.ProjectRole import ProjectRoleAction
from ...filter import RoleFilter
from ...security import Auth, RoleFinder
from ...services import Service
from .ActivityForm import ActivityPagination


USER_ACTIVITY_SCHEMA = {
    "activities": [
        (
            UserActivity,
            {
                "schema": {
                    "refer?": BaseActivityModel,
                    "references?": {"refer_type": "project", "<refer table>": "object"},
                }
            },
        )
    ],
    "count_new_records": "integer",
}


@AppRouter.api.get(
    "/activity/user", tags=["Activity"], responses=OpenApiSchema().suc(USER_ACTIVITY_SCHEMA).auth().forbidden().get()
)
@AuthFilter.add("user")
async def get_current_user_activities(
    pagination: ActivityPagination = Depends(), user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_user(user, pagination, pagination.refer_time, only_count=True)
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_user(user, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, _ = result
    return JsonResponse(content={"activities": activities, "count_new_records": count_new_records})


@AppRouter.api.get(
    "/activity/project/{project_uid}/assignee/{assignee_uid}",
    tags=["Activity"],
    responses=OpenApiSchema().suc(USER_ACTIVITY_SCHEMA).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def get_project_assignee_activities(
    project_uid: str, assignee_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_project_assignee(
            project_uid, assignee_uid, pagination, pagination.refer_time, only_count=True
        )
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_project_assignee(
        project_uid, assignee_uid, pagination, pagination.refer_time
    )
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, _ = result
    return JsonResponse(content={"activities": activities, "count_new_records": count_new_records})


@AppRouter.api.get(
    "/activity/project/{project_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema().suc({"activities": [ProjectActivity], "count_new_records": "integer"}).auth().forbidden().get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_project_activities(
    project_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_project(
            project_uid, pagination, pagination.refer_time, only_count=True
        )
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_project(project_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, project = result
    return JsonResponse(
        content={
            "activities": activities,
            "count_new_records": count_new_records,
            "references": {"project": {"uid": project.get_uid()}},
        }
    )


@AppRouter.api.get(
    "/activity/project/{project_uid}/card/{card_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema().suc({"activities": [ProjectActivity], "count_new_records": "integer"}).auth().forbidden().get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_card_activities(
    project_uid: str, card_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_card(
            project_uid, card_uid, pagination, pagination.refer_time, only_count=True
        )
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_card(project_uid, card_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, project, card = result
    return JsonResponse(
        content={
            "activities": activities,
            "count_new_records": count_new_records,
            "references": {
                "project": {
                    "uid": project.get_uid(),
                },
                "card": {
                    "uid": card.get_uid(),
                },
            },
        }
    )


@AppRouter.api.get(
    "/activity/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema()
        .suc({"activities": [ProjectWikiActivity], "count_new_records": "integer"})
        .auth()
        .forbidden()
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add()
async def get_wiki_activities(
    project_uid: str, wiki_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    if pagination.only_count:
        result = await service.activity.get_list_by_wiki(
            project_uid, wiki_uid, pagination, pagination.refer_time, only_count=True
        )
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_wiki(project_uid, wiki_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, project, project_wiki = result
    return JsonResponse(
        content={
            "activities": activities,
            "count_new_records": count_new_records,
            "references": {
                "project": {
                    "uid": project.get_uid(),
                },
                "project_wiki": {
                    "uid": project_wiki.get_uid(),
                },
            },
        }
    )
