from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import (
    CardCheckRelatedForm,
    CardifyCheckitemForm,
    ChangeCardCheckitemStatusForm,
    ChangeOrderForm,
    project_role_finder,
)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_title(
    card_uid: str,
    checkitem_uid: str,
    form: CardCheckRelatedForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_title(user, card_uid, checkitem_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_order(
    card_uid: str,
    checkitem_uid: str,
    form: ChangeOrderForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(user, card_uid, checkitem_uid, form.order, form.parent_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/status")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_status(
    card_uid: str,
    checkitem_uid: str,
    form: ChangeCardCheckitemStatusForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.change_status(user, card_uid, checkitem, form.status)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def cardify_checkitem(
    card_uid: str,
    checkitem_uid: str,
    form: CardifyCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    cardified_card = await service.checkitem.cardify(user, card_uid, checkitem, form.column_uid)
    if not cardified_card:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/toggle-checked")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checkitem_checked(
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.toggle_checked(user, card_uid, checkitem)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checkitem(
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.delete(user, card_uid, checkitem)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
