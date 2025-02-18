from fastapi import Depends, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import ProjectActivity, ProjectRole, ProjectWikiActivity, UserActivity
from ...models.BaseActivityModel import BaseActivityModel
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from ..board.scopes import project_role_finder
from .ActivityForm import ActivityPagination


@AppRouter.api.get(
    "/activity/user",
    tags=["Activity"],
    responses=(
        OpenApiSchema()
        .suc(
            {
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
        )
        .auth()
        .no_bot()
        .get()
    ),
)
@AuthFilter.add
async def get_user_activities(
    pagination: ActivityPagination = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if pagination.only_count:
        result = await service.activity.get_list_by_user(
            user_or_bot, pagination, pagination.refer_time, only_count=True
        )
        return JsonResponse(content={"count_new_records": result or 0})

    result = await service.activity.get_list_by_user(user_or_bot, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []})
    activities, count_new_records, _ = result
    return JsonResponse(content={"activities": activities, "count_new_records": count_new_records})


@AppRouter.api.get(
    "/activity/project/{project_uid}",
    tags=["Activity"],
    responses=(
        OpenApiSchema().suc({"activities": [ProjectActivity], "count_new_records": "integer"}).auth().no_bot().get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
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
        OpenApiSchema().suc({"activities": [ProjectActivity], "count_new_records": "integer"}).auth().no_bot().get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
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
        OpenApiSchema().suc({"activities": [ProjectWikiActivity], "count_new_records": "integer"}).auth().no_bot().get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
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
