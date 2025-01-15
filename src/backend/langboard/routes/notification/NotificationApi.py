from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...services import Service


@AppRouter.api.get("/notification/all")
@AuthFilter.add
async def get_notifications(
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notifications = await service.notification.get_list(user)

    return JsonResponse(content={"notifications": notifications}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/notification/{notification_uid}")
@AuthFilter.add
async def delete_notification(
    notification_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.notification.delete(user, notification_uid)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/notification/all")
@AuthFilter.add
async def delete_notifications(
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    await service.notification.delete_all(user)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
