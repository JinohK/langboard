from fastapi import status
from ...core.db import EditorContentModel
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse, SocketTopic
from ...core.security import Auth
from ...models import CardCommentReaction, ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import ToggleCardCommentReactionForm
from .RoleFinder import project_role_finder


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
    result = await service.card_comment.create(user, card_uid, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:comment:added:{card_uid}",
        data={"model_id": result.model_id},
    )

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
    result = await service.card_comment.update(user, card_comment, comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:comment:updated:{card_uid}",
        data={"model_id": result.model_id},
    )

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
    result = await service.card_comment.delete(user, card_comment)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:comment:deleted:{card_uid}",
        data={"model_id": result.model_id},
    )

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
    is_reacted = await service.reaction.toggle(user, CardCommentReaction, card_comment.uid, form.reaction)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:comment:reacted:{card_uid}",
        data={
            "user_id": user.id,
            "comment_uid": comment_uid,
            "reaction": form.reaction,
            "is_reacted": is_reacted,
        },
    )

    return JsonResponse(content={"is_reacted": is_reacted}, status_code=status.HTTP_200_OK)
