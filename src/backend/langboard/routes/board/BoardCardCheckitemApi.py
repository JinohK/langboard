from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
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


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checkitem not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_title(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_title(user_or_bot, project_uid, card_uid, checkitem_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/order",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema().auth(with_bot=True).role(with_bot=True).err(404, "Project, card, or checkitem not found.").get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_order(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(
        user_or_bot, project_uid, card_uid, checkitem_uid, form.order, form.parent_uid
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/status",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to update this checkitem.")
        .err(404, "Project, card, or checkitem not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_status(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeCardCheckitemStatusForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.change_status(user_or_bot, project_uid, card_uid, checkitem, form.status)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to update this checkitem.")
        .err(404, "Project, card, or checkitem not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def cardify_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CardifyCheckitemForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    cardified_card = await service.checkitem.cardify(user_or_bot, project_uid, card_uid, checkitem, form.column_uid)
    if not cardified_card:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/toggle-checked",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to update this checkitem.")
        .err(404, "Project, card, or checkitem not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checkitem_checked(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.toggle_checked(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}",
    tags=["Board.Card.Checkitem"],
    responses=(
        OpenApiSchema()
        .auth(with_bot=True)
        .role(with_bot=True)
        .err(403, "No permission to delete this checkitem.")
        .err(404, "Project, card, or checkitem not found.")
        .get()
    ),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.delete(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
