from datetime import datetime
from fastapi import status
from ...core.db import EditorContentModel
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import ChangeCardDetailsForm, ChangeOrderForm
from .RoleFinder import project_role_finder


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_card_order(
    card_uid: str,
    form: ChangeOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.card.change_order(user, card_uid, form.order, form.parent_uid)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


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
    card_uid: str, form: ChangeCardDetailsForm, user: User = Auth.scope("api"), service: Service = Service.scope()
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
    revert_key = await service.card.update(card, form_dict, user)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    response = {}
    for key in form_dict:
        response[key] = getattr(card, key)
    return JsonResponse(content=response, status_code=status.HTTP_200_OK)
