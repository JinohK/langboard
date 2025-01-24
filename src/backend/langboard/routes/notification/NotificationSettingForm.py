from ...core.routing import BaseFormModel, form_model
from ...models.UserNotification import NotificationType
from ...models.UserNotificationUnsubscription import NotificationChannel


@form_model
class NotificationSettingForm(BaseFormModel):
    channel: NotificationChannel
    is_unsubscribed: bool


@form_model
class NotificationSettingTypeForm(BaseFormModel):
    channel: NotificationChannel
    notification_type: NotificationType
    is_unsubscribed: bool
