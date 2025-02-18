from fastapi import status
from ...core.ai import Bot
from ...core.db import EditorContentModel, User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import CardComment, ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ToggleCardCommentReactionForm, project_role_finder


@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/comment",
    tags=["Board.Card.Comment"],
    responses=(OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project or card not found.").get()),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def add_card_comment(
    project_uid: str,
    card_uid: str,
    comment: EditorContentModel,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_comment.create(user_or_bot, project_uid, card_uid, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}",
    tags=["Board.Card.Comment"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to update this comment.")
        .err(404, "Project, card, or comment not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
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
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    if not _is_owner(user_or_bot, card_comment):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.update(user_or_bot, project_uid, card_uid, card_comment, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}",
    tags=["Board.Card.Comment"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to delete this comment.")
        .err(404, "Project, card, or comment not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    if not _is_owner(user_or_bot, card_comment):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.delete(user_or_bot, project_uid, card_uid, card_comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/comment/{comment_uid}/react",
    tags=["Board.Card.Comment"],
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or comment not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def react_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    form: ToggleCardCommentReactionForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.card_comment.toggle_reaction(user_or_bot, project_uid, card_uid, card_comment, form.reaction)
    if result is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"is_reacted": result}, status_code=status.HTTP_200_OK)


def _is_owner(user_or_bot: User | Bot, card_comment: CardComment):
    if isinstance(user_or_bot, User):
        return card_comment.user_id == user_or_bot.id or not user_or_bot.is_admin
    else:
        return card_comment.bot_id == user_or_bot.id
