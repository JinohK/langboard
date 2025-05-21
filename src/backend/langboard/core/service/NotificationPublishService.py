from typing import Any
from pydantic import BaseModel
from ...models.UserNotification import NotificationType
from ...resources.locales.EmailTemplateNames import TEmailTemplateName
from ..ai import Bot
from ..broadcast import DispatcherModel, DispatcherQueue
from ..db import DbSession, SqlBuilder, User
from ..utils.decorators import staticclass


class NotificationPublishModel(BaseModel):
    notifier: User | Bot
    target_user: User
    notification_type: NotificationType
    scope_models: list[tuple[str, int]] | None

    # web
    record_list: list[tuple[str, int, str]]
    message_vars: dict[str, Any] = {}

    # email
    email_template_name: TEmailTemplateName | None
    email_formats: dict[str, str] | None


@staticclass
class NotificationPublishService:
    @staticmethod
    def put_dispather(model: NotificationPublishModel):
        dispatacher_model = DispatcherModel(event="notification_publish", data=model.model_dump())
        DispatcherQueue.put(dispatacher_model)

    @staticmethod
    async def parse(dispatcher_data: dict[str, Any]):
        model = NotificationPublishModel(**dispatcher_data)
        async with DbSession.use(readonly=True) as db:
            result = await db.exec(SqlBuilder.select.table(User).where(User.column("id") == model.notifier.id))
            notifier = result.first()
            if not notifier:
                result = await db.exec(SqlBuilder.select.table(Bot).where(Bot.column("id") == model.notifier.id))
                notifier = result.first()
        if not notifier:
            raise ValueError("Notifier not found")
        model.notifier = notifier
        return model
