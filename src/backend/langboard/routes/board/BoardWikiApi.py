from fastapi import File, UploadFile, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...core.storage import Storage, StorageName
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    AssigneesForm,
    ChangeOrderForm,
    ChangeWikiDetailsForm,
    ChangeWikiPublicForm,
    WikiForm,
    project_role_finder,
)


@AppRouter.api.get("/board/{project_uid}/wikis")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_wikis(
    project_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    wikis = await service.project_wiki.get_board_list(user_or_bot, project_uid)
    project_members = await service.project.get_assigned_users(project, as_api=True)
    project_bots = await service.project.get_assigned_bots(project, as_api=True)
    return JsonResponse(
        content={"wikis": wikis, "project_members": project_members, "project_bots": project_bots},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.post("/board/{project_uid}/wiki")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def create_wiki(
    project_uid: str,
    form: WikiForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.create(user_or_bot, project_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_wiki = result

    return JsonResponse(content={"wiki": api_wiki}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_wiki_details(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiDetailsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    form_dict = {}
    for key in form.model_fields:
        value = getattr(form, key)
        if value is None:
            continue
        form_dict[key] = value

    result = await service.project_wiki.update(user_or_bot, project_uid, wiki_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in form.model_fields:
            if ["title", "content"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None:
                continue
            response[key] = service.project_wiki._convert_to_python(value)
        return JsonResponse(content=response, status_code=status.HTTP_200_OK)

    return JsonResponse(content=result, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/public")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_wiki_public(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiPublicForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.change_public(user_or_bot, project_uid, wiki_uid, form.is_public)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/assignees")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def update_wiki_assignees(
    project_uid: str,
    wiki_uid: str,
    form: AssigneesForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.project_wiki.update_assignees(user_or_bot, project_uid, wiki_uid, form.assignees)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_wiki_order(
    project_uid: str,
    wiki_uid: str,
    form: ChangeOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.change_order(project_uid, wiki_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/wiki/{wiki_uid}/attachment")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def upload_wiki_attachment(
    project_uid: str,
    wiki_uid: str,
    attachment: UploadFile = File(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if not attachment:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    file_model = Storage.upload(attachment, StorageName.Wiki)
    if not file_model:
        return JsonResponse(content={}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    result = await service.project_wiki.upload_attachment(user_or_bot, project_uid, wiki_uid, file_model)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={**result.api_response(), "user": user_or_bot.api_response()},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.delete("/board/{project_uid}/wiki/{wiki_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_wiki(
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.delete(user_or_bot, project_uid, wiki_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
