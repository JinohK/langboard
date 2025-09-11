from typing import Literal, cast
from core.filter import AuthFilter
from core.routing import AppRouter, JsonResponse
from core.schema import OpenApiSchema
from fastapi import Depends
from models import User, UserNotification
from ...security import Auth
from ...services import Service
from .NotificationForm import NotificationForm


@AppRouter.api.get(
    "/notifications",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notifications": [UserNotification]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_notification_subscription(
    form: NotificationForm = Depends(), user: User = Auth.scope("api_user"), service: Service = Service.scope()
) -> JsonResponse:
    if form.time_range not in ["3d", "7d", "1m", "all"]:
        form.time_range = "3d"
    notifications = await service.notification.get_list(user, cast(Literal["3d", "7d", "1m", "all"], form.time_range))
    return JsonResponse(content={"notifications": notifications})
