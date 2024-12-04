from datetime import datetime
from typing import cast
from fastapi import status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...core.utils.DateTime import calculate_time_diff_in_seconds
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .Models import CardifyCheckitemForm, ChangeOrderForm, CreateCardCheckitemForm
from .RoleFinder import project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    card_uid: str,
    form: CreateCardCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.create(user, card_uid, form.title, None, form.assignees)
    response = await service.checkitem.convert_api_response(checkitem)
    return JsonResponse(content={"checkitem": response}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/sub-checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_sub_checkitem(
    card_uid: str,
    checkitem_uid: str,
    form: CreateCardCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.create(user, card_uid, form.title, checkitem_uid, form.assignees)
    response = await service.checkitem.convert_api_response(checkitem)
    return JsonResponse(content={"checkitem": response}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_title(
    card_uid: str,
    checkitem_uid: str,
    form: CreateCardCheckitemForm,
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
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.checkitem.change_order(card_uid, checkitem_uid, form.order)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/sub-checkitem/{sub_checkitem_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_sub_checkitem_order(
    card_uid: str,
    sub_checkitem_uid: str,
    form: ChangeOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.checkitem.change_order(card_uid, sub_checkitem_uid, form.order, form.parent_uid)
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
    new_card = await service.checkitem.cardify(
        user, card_uid, checkitem_uid, form.column_uid, form.with_sub_checkitems, form.with_assign_users
    )
    if not new_card:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    return JsonResponse(
        content={"new_card": await service.card.convert_board_list_api_response(new_card)},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checkitem(
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.checkitem.delete(user, card_uid, checkitem_uid)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/timer/toggle")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checkitem_timer(
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    timer, acc_time_seconds = await service.checkitem.get_timer(checkitem_uid)
    if timer:
        timer = await service.checkitem.stop_timer(user, card_uid, checkitem_uid)
        if not timer:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

        acc_time_seconds = acc_time_seconds + calculate_time_diff_in_seconds(
            cast(datetime, timer.stopped_at), timer.started_at
        )
    else:
        timer = await service.checkitem.start_timer(user, card_uid, checkitem_uid)
        if not timer:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={"timer": timer.api_response(), "acc_time_seconds": acc_time_seconds}, status_code=status.HTTP_200_OK
    )
