from fastapi import status
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
    card_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.create(user, card_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/notify")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def notify_checklist(
    card_uid: str,
    checklist_uid: str,
    form: CardChecklistNotifyForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.notify(user, card_uid, checklist_uid, form.member_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_title(
    card_uid: str,
    checklist_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_title(user, card_uid, checklist_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checklist_order(
    card_uid: str,
    checklist_uid: str,
    form: ChangeOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checklist.change_order(user, card_uid, checklist_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}/toggle-checked")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checklist_checked(
    card_uid: str, checklist_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.checklist.toggle_checked(user, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checklist/{checklist_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checklist(
    card_uid: str, checklist_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.checklist.delete(user, card_uid, checklist_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
