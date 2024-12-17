from datetime import datetime
from typing import Any, cast
from fastapi import status
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse, SocketTopic
from ...core.security import Auth
from ...core.service import ModelIdService
from ...core.utils.DateTime import calculate_time_diff_in_seconds
from ...models import ProjectRole, User
from ...models.ProjectRole import ProjectRoleAction
from ...services import Service
from .scopes import CardifyCheckitemForm, ChangeOrderForm, CreateCardCheckitemForm, project_role_finder


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_checkitem(
    project_uid: str,
    card_uid: str,
    form: CreateCardCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user, card_uid, form.title, None, form.assigned_users)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_checkitem = result.data

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:checkitem:created:{card_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={"checkitem": api_checkitem}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/sub-checkitem")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def create_sub_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CreateCardCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.create(user, card_uid, form.title, checkitem_uid, form.assigned_users)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, api_checkitem = result.data

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:sub-checkitem:created:{checkitem_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={"checkitem": api_checkitem}, status_code=status.HTTP_201_CREATED)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_title(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CreateCardCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_title(user, card_uid, checkitem_uid, form.title)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, cardified_card = result.data

    model = await ModelIdService.get_model(result.model_id)
    if model:
        await AppRouter.publish(
            topic=SocketTopic.Board,
            topic_id=project_uid,
            event_response=f"board:card:checkitem:title:changed:{model["uid"]}",
            data={"title": model["title"]},
        )

        if cardified_card:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:title:changed:{cardified_card.uid}",
                data={"title": model["title"]},
            )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_checkitem_order(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(card_uid, checkitem_uid, form.order)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:checkitem:order:changed:{card_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/board/{project_uid}/card/{card_uid}/sub-checkitem/{sub_checkitem_uid}/order")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def change_sub_checkitem_order(
    project_uid: str,
    card_uid: str,
    sub_checkitem_uid: str,
    form: ChangeOrderForm,
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(card_uid, sub_checkitem_uid, form.order, form.parent_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    model = await ModelIdService.get_model(result.model_id)
    if model:
        if "to_column_uid" in model:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:sub-checkitem:order:changed:{model["to_column_uid"]}",
                data={"move_type": "to_column", "uid": model["uid"], "order": model["order"]},
            )
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:sub-checkitem:order:changed:{model["from_column_uid"]}",
                data={"move_type": "from_column", "uid": model["uid"], "order": model["order"]},
            )
        else:
            await AppRouter.publish(
                topic=SocketTopic.Board,
                topic_id=project_uid,
                event_response=f"board:card:sub-checkitem:order:changed:{model["from_column_uid"]}",
                data={"move_type": "in_column", "uid": model["uid"], "order": model["order"]},
            )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def cardify_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CardifyCheckitemForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.cardify(
        user, card_uid, checkitem_uid, form.column_uid, form.with_sub_checkitems, form.with_assign_users
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    _, new_card_api = result.data

    model = await ModelIdService.get_model(result.model_id)
    if model:
        await AppRouter.publish(
            topic=SocketTopic.Board,
            topic_id=project_uid,
            event_response=f"board:card:checkitem:cardified:{checkitem_uid}",
            data=model,
        )
        await AppRouter.publish(
            topic=SocketTopic.Board,
            topic_id=project_uid,
            event_response=f"board:card:created:{new_card_api["column_uid"]}",
            data={"card": model["new_card"]},
        )

    return JsonResponse(
        content={"new_card": new_card_api},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.delete("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def delete_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    result = await service.checkitem.delete(user, card_uid, checkitem_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
    checkitem = result.data
    parent_uid = checkitem.checkitem_uid if checkitem.checkitem_uid else checkitem.card_uid

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:checkitem:deleted:{parent_uid}",
        data={"model_id": result.model_id},
    )

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/timer/toggle")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], project_role_finder)
@AuthFilter.add
async def toggle_checkitem_timer(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    timer, acc_time_seconds = await service.checkitem.get_timer(checkitem_uid)
    should_start = timer is not None
    if not should_start:
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

    model: dict[str, Any] = {"acc_time_seconds": acc_time_seconds}
    event_name = "started" if should_start else "stopped"
    if should_start:
        model["timer"] = timer.api_response()

    await AppRouter.publish(
        topic=SocketTopic.Board,
        topic_id=project_uid,
        event_response=f"board:card:checkitem:timer:{event_name}:{checkitem_uid}",
        data=model,
    )

    model["timer"] = timer.api_response()

    return JsonResponse(content={**model}, status_code=status.HTTP_200_OK)
