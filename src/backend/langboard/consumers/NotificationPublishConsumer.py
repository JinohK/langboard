from ..core.broadcast import WorkerQueue
from ..core.db import DbSession, SnowflakeID, User
from ..core.service import NotificationPublishModel, NotificationPublishService
from ..models import UserNotification
from ..models.UserNotificationUnsubscription import NotificationChannel
from ..publishers import NotificationPublisher
from ..services import Service


@WorkerQueue.consume("notification_publish")
async def notification_publish(data: dict):
    try:
        model = await NotificationPublishService.parse(data)
    except Exception:
        return

    await web_notification_publish(model)
    await email_notification_publish(model)
    await mobile_notification_publish(model)
    await iot_notification_publish(model)


async def web_notification_publish(model: NotificationPublishModel):
    with Service.use() as service:
        has_unsubscription = await service.user_notification_setting.has_unsubscription(model, NotificationChannel.Web)
    if has_unsubscription:
        return

    record_list = [(table_name, SnowflakeID(record_id)) for table_name, record_id in model.record_list]

    notification = UserNotification(
        notifier_type="user" if isinstance(model.notifier, User) else "bot",
        notifier_id=model.notifier.id,
        receiver_id=model.target_user.id,
        notification_type=model.notification_type,
        message_vars=model.message_vars,
        record_list=record_list,
    )

    async with DbSession.use(readonly=False) as db:
        await db.insert(notification)

    api_notification = await service.notification.convert_to_api_response(notification)
    NotificationPublisher.notified(model.target_user, api_notification)


async def email_notification_publish(model: NotificationPublishModel):
    if not model.email_template_name:
        return

    with Service.use() as service:
        has_unsubscription = await service.user_notification_setting.has_unsubscription(
            model, NotificationChannel.Email
        )
        if has_unsubscription:
            return

        await service.email.send_template(
            model.target_user.preferred_lang,
            model.target_user.email,
            model.email_template_name,
            model.email_formats or {},
        )


async def mobile_notification_publish(model: NotificationPublishModel):
    with Service.use() as service:
        has_unsubscription = await service.user_notification_setting.has_unsubscription(
            model, NotificationChannel.Mobile
        )
        if has_unsubscription:
            return

        # TODO: mobile, Implement mobile notification


async def iot_notification_publish(model: NotificationPublishModel):
    with Service.use() as service:
        has_unsubscription = await service.user_notification_setting.has_unsubscription(model, NotificationChannel.IoT)
        if has_unsubscription:
            return

        # TODO: mobile, Implement mobile notification
