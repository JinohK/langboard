from typing import Literal
from fastapi import Depends, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse, SocketTopic
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...core.service import ServiceHelper
from ...models import Card, CardMetadata, Project, ProjectRole, ProjectWiki, ProjectWikiMetadata
from ...models.ProjectRole import ProjectRoleAction
from ...publishers.MetadataPublisher import MetadataPublisher
from ...services import Service
from ..board.scopes import project_role_finder
from .MetadataForm import MetadataDeleteForm, MetadataForm, MetadataGetModel


def __create_default_schema(get_type: Literal["list", "key"] | None = None) -> OpenApiSchema:
    schema = OpenApiSchema().auth().forbidden()
    if get_type:
        if get_type == "list":
            schema = schema.suc({"metadata": [{"key": "value"}]})
        elif get_type == "key":
            schema = schema.suc({"key": "value?"})
    return schema


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Get card metadata.",
    responses=__create_default_schema("list").err(404, ApiErrorCode.NF2004).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def get_card_metadata(project_uid: str, card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.get_list(CardMetadata, card, as_api=True, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(query=MetadataGetModel)
@AppRouter.api.get(
    "/metadata/project/{project_uid}/card/{card_uid}/key",
    tags=["Metadata"],
    description="Get card metadata by key.",
    responses=__create_default_schema("key").err(404, ApiErrorCode.NF2004).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def get_card_metadata_by_key(
    project_uid: str, card_uid: str, get_query: MetadataGetModel = Depends(), service: Service = Service.scope()
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.get_by_key(CardMetadata, card, get_query.key, as_api=False)
    key = metadata.key if metadata else get_query.key
    value = metadata.value if metadata else None
    return JsonResponse(content={key: value})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Save card metadata.",
    responses=__create_default_schema().err(404, ApiErrorCode.NF2018).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
async def save_card_metadata(
    project_uid: str, card_uid: str, form: MetadataForm, service: Service = Service.scope()
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    metadata = await service.metadata.save(CardMetadata, card, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content=ApiErrorCode.NF2018, status_code=status.HTTP_404_NOT_FOUND)

    await MetadataPublisher.updated_metadata(SocketTopic.BoardCard, card.get_uid(), form.key, form.value, form.old_key)
    return JsonResponse()


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Delete card metadata.",
    responses=__create_default_schema().err(404, ApiErrorCode.NF2004).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
async def delete_card_metadata(
    form: MetadataDeleteForm, project_uid: str, card_uid: str, service: Service = Service.scope()
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (Card, card_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)
    _, card = params

    await service.metadata.delete(CardMetadata, card, form.keys)

    await MetadataPublisher.deleted_metadata(SocketTopic.BoardCard, card.get_uid(), form.keys)
    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Get wiki metadata.",
    responses=(__create_default_schema("list").err(403, ApiErrorCode.PE2006).err(404, ApiErrorCode.NF2010).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def get_wiki_metadata(
    project_uid: str, wiki_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2010, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2006, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.get_list(ProjectWikiMetadata, wiki, as_api=True, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(query=MetadataGetModel)
@AppRouter.api.get(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}/key",
    tags=["Metadata"],
    description="Get wiki metadata by key.",
    responses=(__create_default_schema("key").err(403, ApiErrorCode.PE2006).err(404, ApiErrorCode.NF2010).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def get_wiki_metadata_by_key(
    project_uid: str,
    wiki_uid: str,
    get_query: MetadataGetModel = Depends(),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2010, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2006, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.get_by_key(ProjectWikiMetadata, wiki, get_query.key, as_api=False)
    key = metadata.key if metadata else get_query.key
    value = metadata.value if metadata else None
    return JsonResponse(content={key: value})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Save wiki metadata.",
    responses=(__create_default_schema().err(403, ApiErrorCode.PE2006).err(404, ApiErrorCode.NF2019).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def save_wiki_metadata(
    project_uid: str,
    wiki_uid: str,
    form: MetadataForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2019, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2006, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.save(ProjectWikiMetadata, wiki, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content=ApiErrorCode.NF2019, status_code=status.HTTP_404_NOT_FOUND)

    await MetadataPublisher.updated_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.key, form.value, form.old_key)
    return JsonResponse()


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Delete wiki metadata.",
    responses=(__create_default_schema().err(403, ApiErrorCode.PE2006).err(404, ApiErrorCode.NF2010).get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def delete_wiki_metadata(
    form: MetadataDeleteForm,
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    params = ServiceHelper.get_records_with_foreign_by_params((Project, project_uid), (ProjectWiki, wiki_uid))
    if not params:
        return JsonResponse(content=ApiErrorCode.NF2010, status_code=status.HTTP_404_NOT_FOUND)
    _, wiki = params

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content=ApiErrorCode.PE2006, status_code=status.HTTP_403_FORBIDDEN)

    await service.metadata.delete(ProjectWikiMetadata, wiki, form.keys)

    await MetadataPublisher.deleted_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.keys)
    return JsonResponse()
