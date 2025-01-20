from fastapi import Depends, status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from ..board.scopes import project_role_finder
from .ActivityForm import ActivityPagination


@AppRouter.api.get("/activity/user")
@AuthFilter.add
async def get_user_activities(
    pagination: ActivityPagination = Depends(), user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.activity.get_list_by_user(user, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []}, status_code=status.HTTP_200_OK)
    activities, is_outdated, _ = result
    return JsonResponse(content={"activities": activities, "is_outdated": is_outdated}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/activity/project/{project_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_activities(
    project_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.activity.get_list_by_project(project_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []}, status_code=status.HTTP_200_OK)
    activities, is_outdated, project = result
    return JsonResponse(
        content={
            "activities": activities,
            "is_outdated": is_outdated,
            "references": {"project": project.api_response()},
        },
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.get("/activity/project/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_activities(
    project_uid: str, card_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.activity.get_list_by_card(project_uid, card_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []}, status_code=status.HTTP_200_OK)
    activities, is_outdated, project, card = result
    return JsonResponse(
        content={
            "activities": activities,
            "is_outdated": is_outdated,
            "references": {
                "project": project.api_response(),
                "card": card.api_response(),
            },
        },
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.get("/activity/project/{project_uid}/wiki/{wiki_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_wiki_activities(
    project_uid: str, wiki_uid: str, pagination: ActivityPagination = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.activity.get_list_by_wiki(project_uid, wiki_uid, pagination, pagination.refer_time)
    if not result:
        return JsonResponse(content={"activities": []}, status_code=status.HTTP_200_OK)
    activities, is_outdated, project, project_wiki = result
    return JsonResponse(
        content={
            "activities": activities,
            "is_outdated": is_outdated,
            "references": {
                "project": project.api_response(),
                "project_wiki": project_wiki.api_response(),
            },
        },
        status_code=status.HTTP_200_OK,
    )
