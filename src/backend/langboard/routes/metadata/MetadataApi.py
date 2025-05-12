from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse, SocketTopic
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import CardMetadata, ProjectRole, ProjectWikiMetadata
from ...models.ProjectRole import ProjectRoleAction
from ...publishers.MetadataPublisher import MetadataPublisher
from ...services import Service
from ..board.scopes import project_role_finder
from .MetadataForm import MetadataDeleteForm, MetadataForm


def __create_default_schema(is_get: bool) -> OpenApiSchema:
    schema = OpenApiSchema().auth(with_bot=True).role(with_bot=True)
    if is_get:
        schema = schema.suc({"metadata": {"key": "value"}})
    return schema


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Get card metadata.",
    responses=__create_default_schema(True).err(404, "Project or card not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_metadata(project_uid: str, card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_uid(card_uid)
    if card is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    metadata = await service.metadata.get_list(CardMetadata, card, as_api=True, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Save card metadata.",
    responses=__create_default_schema(False).err(404, "Project or card not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def save_card_metadata(
    project_uid: str, card_uid: str, form: MetadataForm, service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_uid(card_uid)
    if card is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    metadata = await service.metadata.save(CardMetadata, card, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    MetadataPublisher.updated_metadata(SocketTopic.BoardCard, card.get_uid(), form.key, form.value, form.old_key)
    return JsonResponse(content={})


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/card/{card_uid}",
    tags=["Metadata"],
    description="Delete card metadata.",
    responses=__create_default_schema(False).err(404, "Project or card not found.").get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_card_metadata(
    form: MetadataDeleteForm, project_uid: str, card_uid: str, service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    card = await service.card.get_by_uid(card_uid)
    if card is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await service.metadata.delete(CardMetadata, card, form.keys)

    MetadataPublisher.deleted_metadata(SocketTopic.BoardCard, card.get_uid(), form.keys)
    return JsonResponse(content={})


@AppRouter.schema()
@AppRouter.api.get(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Get wiki metadata.",
    responses=(
        __create_default_schema(True)
        .err(403, "No permission to update this wiki.")
        .err(404, "Project or wiki not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_wiki_metadata(
    project_uid: str, wiki_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if wiki is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.get_list(ProjectWikiMetadata, wiki, as_api=True, as_dict=True)
    return JsonResponse(content={"metadata": metadata})


@AppRouter.schema(form=MetadataForm)
@AppRouter.api.post(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Save wiki metadata.",
    responses=(
        __create_default_schema(False)
        .err(403, "No permission to update this wiki.")
        .err(404, "Project or wiki not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def save_wiki_metadata(
    project_uid: str,
    wiki_uid: str,
    form: MetadataForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if wiki is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    metadata = await service.metadata.save(ProjectWikiMetadata, wiki, form.key, form.value, form.old_key)
    if metadata is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    MetadataPublisher.updated_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.key, form.value, form.old_key)
    return JsonResponse(content={})


@AppRouter.schema(form=MetadataDeleteForm)
@AppRouter.api.delete(
    "/metadata/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Metadata"],
    description="Delete wiki metadata.",
    responses=(
        __create_default_schema(False)
        .err(403, "No permission to update this wiki.")
        .err(404, "Project or wiki not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_wiki_metadata(
    form: MetadataDeleteForm,
    project_uid: str,
    wiki_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    wiki = await service.project_wiki.get_by_uid(wiki_uid)
    if wiki is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not await service.project_wiki.is_assigned(user_or_bot, wiki):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    await service.metadata.delete(ProjectWikiMetadata, wiki, form.keys)

    MetadataPublisher.deleted_metadata(SocketTopic.BoardWikiPrivate, wiki_uid, form.keys)
    return JsonResponse(content={})
