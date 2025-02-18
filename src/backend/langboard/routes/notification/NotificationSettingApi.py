from fastapi import status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...models.UserNotification import NotificationType
from ...services import Service
from ..board.scopes import project_role_finder
from .NotificationSettingForm import NotificationSettingForm, NotificationSettingTypeForm


@AppRouter.api.put(
    "/notification/setting/all",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_notification_subscription(
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_all(
        user_or_bot, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/type",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_type_notification_subscription(
    form: NotificationSettingTypeForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if form.notification_type not in NotificationType and form.notification_type not in NotificationType._member_names_:
        return JsonResponse(content={"notification_types": []})

    notification_types = await service.user_notification_setting.toggle_type(
        user_or_bot, form.channel, form.notification_type, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/project",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_project_notification_subscription(
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_project(
        user_or_bot, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/column",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_column_notification_subscription(
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_column(
        user_or_bot, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/card",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_card_notification_subscription(
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_card(
        user_or_bot, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/wiki",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@AuthFilter.add
async def toggle_all_wiki_notification_subscription(
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_wiki(
        user_or_bot, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/project/{project_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_project_notification_subscription(
    project_uid: str,
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_project(
        user_or_bot, form.channel, form.is_unsubscribed, project_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/project/{project_uid}/column/{column_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_column_notification_subscription(
    project_uid: str,
    column_uid: str,
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_column(
        user_or_bot, form.channel, form.is_unsubscribed, project_uid, column_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/project/{project_uid}/card/{card_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_card_notification_subscription(
    project_uid: str,
    card_uid: str,
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_card(
        user_or_bot, form.channel, form.is_unsubscribed, project_uid, card_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/setting/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().no_bot().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_wiki_notification_subscription(
    project_uid: str,
    wiki_uid: str,
    form: NotificationSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    notification_types = await service.user_notification_setting.toggle_wiki(
        user_or_bot, form.channel, form.is_unsubscribed, project_uid, wiki_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )
