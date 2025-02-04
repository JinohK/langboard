from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import CardChecklistNotifyForm, CardCheckRelatedForm, ChangeOrderForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checklist")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checklist(
    project_uid: str,
    card_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.create(user_or_bot, project_uid, card_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user_or_bot, project_uid, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/notify")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def notify_checklist(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardChecklistNotifyForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.notify(user_or_bot, project_uid, card_uid, checklist_uid, form.member_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_title(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_title(user_or_bot, project_uid, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_order(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    form: ChangeOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_order(user_or_bot, project_uid, card_uid, checklist_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/toggle-checked")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checklist_checked(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.toggle_checked(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checklist(
    project_uid: str,
    card_uid: str,
    checklist_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.delete(user_or_bot, project_uid, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
