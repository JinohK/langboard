from fastapi import File, UploadFile, status
from pydantic import BaseModel
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse, SocketTopic
from ...core.security import Auth
from ...core.service import ModelIdService
from ...core.storage import Storage, StorageName
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import AssignUsersForm, ChangeOrderForm, ChangeWikiDetailsForm, WikiForm, project_role_finder
from .scopes.Wiki import ChangeWikiPublicForm


@AppRouter.api.get("/board/{project_uid}/wikis")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_project_wikis(
    project_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    wikis = await service.project_wiki.get_board_list(user, project_uid)
    project_members = await service.project.get_assigned_users(project, as_api=True)
    return JsonResponse(content={"wikis": wikis, "project_members": project_members}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/wiki")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def create_wiki(
    project_uid: str,
    form: WikiForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.create(user, project_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    _, api_wiki = result

    await AppRouter.publish(
        topic=SocketTopic.BoardWiki,
        topic_id=project_uid,
        event_response=f"board:wiki:created:{project_uid}",
        data={"wiki": api_wiki},
    )

    return JsonResponse(content={"wiki": api_wiki}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_wiki_details(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiDetailsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    form_dict = {}
    for key in form.model_fields:
        value = getattr(form, key)
        if value is None:
            continue
        form_dict[key] = value

    wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if not wiki:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.project_wiki.update(user, wiki, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    updated, revert_key, assigned_users = result.data
    if not updated:
        response = {}
        for key in form_dict:
            response[key] = form_dict[key]
            if isinstance(response[key], BaseModel):
                response[key] = response[key].model_dump()
        return JsonResponse(content=response, status_code=status.HTTP_200_OK)

    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    response = {}
    model = await ModelIdService.get_model(result.model_id)
    if model:
        for key in model:
            if ["title", "content"].count(key) == 0:
                continue
            value = model[key]
            response[key] = value
            if wiki.is_public:
                await AppRouter.publish(
                    topic=SocketTopic.BoardWiki,
                    topic_id=project_uid,
                    event_response=f"board:wiki:{key}:changed:{wiki_uid}",
                    data={key: value},
                )
            else:
                for assigned_user in assigned_users:
                    await AppRouter.publish(
                        topic=SocketTopic.BoardWikiPrivate,
                        topic_id=assigned_user.username,
                        event_response=f"board:wiki:{key}:changed:{wiki_uid}",
                        data={key: value},
                    )

    return JsonResponse(content=response, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/public")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def change_wiki_public(
    project_uid: str,
    wiki_uid: str,
    form: ChangeWikiPublicForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.change_public(user, project_uid, wiki_uid, form.is_public)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    wiki, project, _ = result.data

    model = await ModelIdService.get_model(result.model_id)
    if model:
        wiki_public_model = model["public"]
        wiki_private_model = model["private"]
        if wiki.is_public:
            await AppRouter.publish(
                topic=SocketTopic.BoardWiki,
                topic_id=project_uid,
                event_response=f"board:wiki:public:changed:{wiki_uid}",
                data={"wiki": wiki_public_model},
            )
        else:
            project_members = await service.project.get_assigned_users(project, as_api=False)
            for project_member in project_members:
                if project_member.is_admin or project_member.id == user.id:
                    await AppRouter.publish(
                        topic=SocketTopic.BoardWikiPrivate,
                        topic_id=project_member.username,
                        event_response=f"board:wiki:public:changed:{wiki_uid}",
                        data={"wiki": wiki_public_model},
                    )
                else:
                    await AppRouter.publish(
                        topic=SocketTopic.BoardWikiPrivate,
                        topic_id=project_member.username,
                        event_response=f"board:wiki:public:changed:{wiki_uid}",
                        data={"wiki": wiki_private_model},
                    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/wiki/{wiki_uid}/assigned-users")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def update_wiki_assigned_users(
    project_uid: str,
    wiki_uid: str,
    form: AssignUsersForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.update_assigned_users(user, project_uid, wiki_uid, form.assigned_users)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, _, prev_assigned_users, assigned_users = result.data

    model = await ModelIdService.get_model(result.model_id)
    if model:
        wiki_public_model = model["public"]
        wiki_private_model = model["private"]

        all_users: list[User] = []
        all_user_ids: list[int | None] = []
        assigned_user_ids = [assigned_user.id for assigned_user in assigned_users]
        for prev_assigned_user in prev_assigned_users:
            if prev_assigned_user.id in all_user_ids:
                continue
            all_users.append(prev_assigned_user)
            all_user_ids.append(prev_assigned_user.id)
        for assigned_user in assigned_users:
            if assigned_user.id in all_user_ids:
                continue
            all_users.append(assigned_user)
            all_user_ids.append(assigned_user.id)

        for all_user in all_users:
            if all_user.is_admin or all_user.id in assigned_user_ids:
                await AppRouter.publish(
                    topic=SocketTopic.BoardWikiPrivate,
                    topic_id=assigned_user.username,
                    event_response=f"board:wiki:assigned_users:changed:{wiki_uid}",
                    data={"wiki": wiki_public_model},
                )
            else:
                await AppRouter.publish(
                    topic=SocketTopic.BoardWikiPrivate,
                    topic_id=assigned_user.username,
                    event_response=f"board:wiki:assigned_users:changed:{wiki_uid}",
                    data={"wiki": wiki_private_model},
                )

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

    await AppRouter.publish(
        topic=SocketTopic.BoardWiki,
        topic_id=project_uid,
        event_response=f"board:wiki:order:changed:{project_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/wiki/{wiki_uid}/attachment")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def upload_wiki_attachment(
    project_uid: str,
    wiki_uid: str,
    attachment: UploadFile = File(),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not attachment:
        return JsonResponse(content={}, status_code=status.HTTP_400_BAD_REQUEST)

    file_model = Storage.upload(attachment, StorageName.Wiki)
    if not file_model:
        return JsonResponse(content={}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    result = await service.project_wiki.upload_attachment(user, project_uid, wiki_uid, file_model)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={**result.data.api_response(), "user": user.api_response()},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.delete("/board/{project_uid}/wiki/{wiki_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_wiki(
    project_uid: str,
    wiki_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.project_wiki.delete(user, project_uid, wiki_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.BoardWiki,
        topic_id=project_uid,
        event_response=f"board:wiki:deleted:{project_uid}",
        data={"uid": wiki_uid},
    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
