from fastapi import status
from ...core.db import EditorContentModel, User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import ToggleCardCommentReactionForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/comment")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def add_card_comment(
    project_uid: str,
    card_uid: str,
    comment: EditorContentModel,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_comment.create(user, project_uid, card_uid, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/comment/{comment_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def update_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    comment: EditorContentModel,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    if card_comment.user_id != user.id and not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.update(user, project_uid, card_uid, card_comment, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/comment/{comment_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def delete_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    if card_comment.user_id != user.id and not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    result = await service.card_comment.delete(user, project_uid, card_uid, card_comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/comment/{comment_uid}/react")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def react_card_comment(
    project_uid: str,
    card_uid: str,
    comment_uid: str,
    form: ToggleCardCommentReactionForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card_comment = await service.card_comment.get_by_uid(comment_uid)
    if not card_comment:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.card_comment.toggle_reaction(user, project_uid, card_uid, card_comment, form.reaction)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"is_reacted": result}, status_code=status.HTTP_200_OK)
