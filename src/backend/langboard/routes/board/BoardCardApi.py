from datetime import datetime
from fastapi import status
from ...core.db import EditorContentModel, User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    AssignUsersForm,
    ChangeCardDetailsForm,
    ChangeOrderForm,
    CreateCardForm,
    UpdateCardLabelsForm,
    UpdateCardRelationshipsForm,
    project_role_finder,
)


@AppRouter.api.get("/board/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_detail(
    project_uid: str, card_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    card = await service.card.get_details(project, card_uid)
    if card is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)
    card["current_user_role_actions"] = await service.project.get_user_role_actions(user, project)
    return JsonResponse(
        content={"card": card, "global_relationships": global_relationships},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.get("/board/{project_uid}/card/{card_uid}/comments")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def get_card_comments(card_uid: str, service: Service = Service.scope()) -> JsonResponse:
    comments = await service.card_comment.get_board_list(card_uid)
    return JsonResponse(content={"comments": comments}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_card(
    project_uid: str, form: CreateCardForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.card.create(user, project_uid, form.column_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_card = result

    return JsonResponse(content={"card": api_card}, status_code=status.HTTP_200_OK)


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
            if value:
                value = datetime.fromisoformat(value)
            else:
                value = None
        elif key == "description":
            value = EditorContentModel(**value)
        form_dict[key] = value

    result = await service.card.update(user, project_uid, card_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        response = {}
        for key in form.model_fields:
            if ["title", "description", "deadline_at"].count(key) == 0:
                continue
            value = getattr(form, key)
            if value is None and key != "deadline_at":
                continue
            response[key] = service.card._convert_to_python(value)
        return JsonResponse(content=response, status_code=status.HTTP_200_OK)

    return JsonResponse(content=result, status_code=status.HTTP_200_OK)


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
    result = await service.card.update_assigned_users(user, project_uid, card_uid, form.assigned_users)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

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
    result = await service.card.change_order(user, project_uid, card_uid, form.order, form.parent_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/labels")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def update_card_labels(
    project_uid: str,
    card_uid: str,
    form: UpdateCardLabelsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card.update_labels(user, project_uid, card_uid, form.labels)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/relationships")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def update_card_relationships(
    project_uid: str,
    card_uid: str,
    form: UpdateCardRelationshipsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.card_relationship.update(user, project_uid, card_uid, form.is_parent, form.relationships)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/archive")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def archive_card(
    project_uid: str, card_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    project = await service.project.get_by_uid(project_uid)
    if project is None:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    column = await service.project_column.get_or_create_archive_if_not_exists(project)

    result = await service.card.change_order(user, project, card_uid, 0, column)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardDelete], project_role_finder)
@AuthFilter.add
async def delete_card(
    project_uid: str, card_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.card.delete(user, project_uid, card_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
