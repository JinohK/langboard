from typing import Any
from core.utils.decorators import staticclass
from models import User, UserNotification
from pydantic import BaseModel
from ...resources.locales.EmailTemplateNames import TEmailTemplateName
from ..broadcast import DispatcherModel, DispatcherQueue


class NotificationPublishModel(BaseModel):
    notification: UserNotification
    api_notification: dict[str, Any]
    target_user: User
    scope_models: list[tuple[str, int]] | None

    # email
    email_template_name: TEmailTemplateName | None
    email_formats: dict[str, str] | None


@staticclass
class NotificationPublisher:
    @staticmethod
    async def put_dispather(model: NotificationPublishModel):
        dispatacher_model = DispatcherModel(event="notification_publish", data=model.model_dump())
        await DispatcherQueue.put(dispatacher_model)
