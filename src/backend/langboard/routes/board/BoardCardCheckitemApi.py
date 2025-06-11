from fastapi import status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...models import Bot, ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...security import Auth
from ...services import Service
from .scopes import (
    CardCheckRelatedForm,
    CardifyCheckitemForm,
    ChangeCardCheckitemStatusForm,
    ChangeChildOrderForm,
    project_role_finder,
)


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem title.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=ChangeChildOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/order",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem order or move to another checklist.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
async def change_checkitem_order_or_move_checklist(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeChildOrderForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(
        user_or_bot, project_uid, card_uid, checkitem_uid, form.order, form.parent_uid
    )
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/status",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem status.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2004).err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add("user")
async def change_checkitem_status(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeCardCheckitemStatusForm,
    user: User = Auth.scope("api_user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user.id:
        return JsonResponse(content=ApiErrorCode.PE2004, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.change_status(user, project_uid, card_uid, checkitem, form.status, from_api=True)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema(form=CardifyCheckitemForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify",
    tags=["Board.Card.Checkitem"],
    description="Cardify checkitem.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2004).err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
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
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content=ApiErrorCode.PE2004, status_code=status.HTTP_403_FORBIDDEN)

    cardified_card = await service.checkitem.cardify(user_or_bot, project_uid, card_uid, checkitem, form.column_uid)
    if not cardified_card:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/toggle-checked",
    tags=["Board.Card.Checkitem"],
    description="Toggle checkitem checked.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2004).err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
async def toggle_checkitem_checked(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content=ApiErrorCode.PE2004, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.toggle_checked(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}",
    tags=["Board.Card.Checkitem"],
    description="Delete checkitem.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2004).err(404, ApiErrorCode.NF2013).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add()
async def delete_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_uid(checkitem_uid)
    if not checkitem:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        return JsonResponse(content=ApiErrorCode.PE2004, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.checkitem.delete(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF2013, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
