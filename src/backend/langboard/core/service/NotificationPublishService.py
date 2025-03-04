from typing import Any
from pydantic import BaseModel
from ...models.UserNotification import NotificationType
from ...resources.locales.EmailTemplateNames import TEmailTemplateName
from ..ai import Bot
from ..broadcast import DispatcherModel, DispatcherQueue
from ..db import User
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
    def parse(dispatcher_data: dict[str, Any]):
        model = NotificationPublishModel(**dispatcher_data)
        return model
