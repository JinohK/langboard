from ...core.db import User
from ...core.routing import AppRouter
from ...core.security import Auth
from ...services import Service


@AppRouter.socket.on("user:notification:read")
async def read_notification(uid: str, user: User = Auth.scope("socket"), service: Service = Service.scope()):
    await service.notification.read(user, uid)


@AppRouter.socket.on("user:notification:read-all")
async def read_all_notification(user: User = Auth.scope("socket"), service: Service = Service.scope()):
    await service.notification.read_all(user)


@AppRouter.socket.on("user:notification:delete")
async def delete_notification(
    notification_uid: str, user: User = Auth.scope("socket"), service: Service = Service.scope()
):
    await service.notification.delete(user, notification_uid)


@AppRouter.socket.on("user:notification:delete-all")
async def delete_notifications(user: User = Auth.scope("api"), service: Service = Service.scope()):
    await service.notification.delete_all(user)
