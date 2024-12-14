from datetime import datetime
from fastapi import status
from ...core.db import EditorContentModel
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse, SocketTopic
from ...core.security import Auth
from ...core.service import ModelIdService
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import AssignUsersForm, ChangeCardDetailsForm, ChangeOrderForm
from .RoleFinder import project_role_finder


@AppRouter.api.get("/board/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_detail(
    project_uid: str, card_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    card = await service.card.get_details(card_uid)
    project = await service.project.get_by_uid(project_uid)
    if card is None or project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    current_user_role_actions = await service.project.get_user_role_actions(user, project)
    return JsonResponse(
        content={"card": card, "current_user_role_actions": current_user_role_actions}, status_code=status.HTTP_200_OK
    )


@AppRouter.api.get("/board/{project_uid}/card/{card_uid}/comments")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_comments(card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    comments = await service.card_comment.get_board_list(card_uid)
    return JsonResponse(content={"comments": comments}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/details")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_card_details(
    project_uid: str,
    card_uid: str,
    form: ChangeCardDetailsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    form_dict = {}
    for key in form.model_fields:
        value = getattr(form, key)
        if value is None:
            continue
        elif key == "deadline_at":
            value = datetime.fromisoformat(value)
        elif key == "description":
            value = EditorContentModel(**value)
        form_dict[key] = value

    card = await service.card.get_by_uid(card_uid)
    if not card:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.card.update(user, card, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    revert_key, checkitem_cardified_from = result.data
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    response = {}
    model = await ModelIdService.get_model(result.model_id)
    if model:
        for key in model:
            if ["title", "deadline_at", "description"].count(key) == 0:
                continue
            value = model[key]
            response[key] = value
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:{key}:changed:{card_uid}",
                data={key: value},
            )

        if "title" in model and checkitem_cardified_from:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:checkitem:title:changed:{checkitem_cardified_from.uid}",
                data={"title": model["title"]},
            )

    return JsonResponse(content=response, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/assigned-users")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def update_card_assigned_users(
    project_uid: str,
    card_uid: str,
    form: AssignUsersForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    card = await service.card.get_by_uid(card_uid)
    if not card:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    result = await service.card.update_assigned_users(user, card, form.assigned_users)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:assigned_users:changed:{card_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_card_order(
    project_uid: str,
    card_uid: str,
    form: ChangeOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.change_order(user, card_uid, form.order, form.parent_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    model = await ModelIdService.get_model(result.model_id)
    if model:
        if "to_column_uid" in model:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:order:changed:{model["to_column_uid"]}",
                data={"move_type": "to_column", "uid": model["uid"], "order": model["order"]},
            )
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:order:changed:{model["from_column_uid"]}",
                data={"move_type": "from_column", "uid": model["uid"], "order": model["order"]},
            )
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:order:changed:{model["uid"]}",
                data={"column_uid": model["to_column_uid"], "column_name": model["column_name"]},
            )
        else:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:order:changed:{model["from_column_uid"]}",
                data={"move_type": "in_column", "uid": model["uid"], "order": model["order"]},
            )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
