from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import CardCheckGroupNotifyForm, CardCheckRelatedForm, ChangeOrderForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkgroup")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_check_group(
    card_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.check_group.create(user, card_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}/checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    card_uid: str,
    check_group_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user, card_uid, check_group_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}/notify")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def notify_check_group(
    card_uid: str,
    check_group_uid: str,
    form: CardCheckGroupNotifyForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.check_group.notify(user, card_uid, check_group_uid, form.member_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_check_group_title(
    card_uid: str,
    check_group_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.check_group.change_title(user, card_uid, check_group_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_check_group_order(
    card_uid: str,
    check_group_uid: str,
    form: ChangeOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.check_group.change_order(user, card_uid, check_group_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}/toggle-checked")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_check_group_checked(
    card_uid: str, check_group_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.check_group.toggle_checked(user, card_uid, check_group_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checkgroup/{check_group_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_check_group(
    card_uid: str, check_group_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.check_group.delete(user, card_uid, check_group_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
