from fastapi import status
from ...core.db import EditorContentModel
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...models import Bot, CardComment, ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...security import Auth
from ...services import Service
from .scopes import ToggleCardCommentReactionForm, project_role_finder


@AppRouter.schema(form=EditorContentModel)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/comment",
    tags=["Board.Card.Comment"],
    description="Add a comment to a card.",
    responses=OpenApiSchema(201).auth().forbidden().err(404, ApiErrorCode.NF2004).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def add_card_comment(
    project_uid: str,
    card_uid: str,
    comment: EditorContentModel,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_comment.create(user_or_bot, project_uid, card_uid, comment)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(status_code=status.HTTP_201_CREATED)


@AppRouter.schema(form=EditorContentModel)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}",
    tags=["Board.Card.Comment"],
    description="Update a comment.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2014).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def update_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    comment: EditorContentModel,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)
    if not _is_owner(user_or_bot, card_comment):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.update(user_or_bot, project_uid, card_uid, card_comment, comment)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}",
    tags=["Board.Card.Comment"],
    description="Delete a comment.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2005).err(404, ApiErrorCode.NF2014).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def delete_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)
    if not _is_owner(user_or_bot, card_comment):
        return JsonResponse(content=ApiErrorCode.PE2005, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.delete(user_or_bot, project_uid, card_uid, card_comment)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=ToggleCardCommentReactionForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}/react",
    tags=["Board.Card.Comment"],
    description="Toggle reaction on a comment.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2014).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add()
async def toggle_reaction_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    form: ToggleCardCommentReactionForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.card_comment.toggle_reaction(user_or_bot, project_uid, card_uid, card_comment, form.reaction)
    if result is None:
        return JsonResponse(content=ApiErrorCode.NF2014, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"is_reacted": result})


def _is_owner(user_or_bot: User | Bot, card_comment: CardComment):
    if isinstance(user_or_bot, User):
        return card_comment.user_id == user_or_bot.id or user_or_bot.is_admin
    else:
        return card_comment.bot_id == user_or_bot.id
