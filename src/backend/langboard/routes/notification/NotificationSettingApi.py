from fastapi import status
from ...core.db import User
from ...core.filter import AuthFilter, RoleFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...models import ProjectRole
from ...models.ProjectRole import ProjectRoleAction
from ...models.UserNotification import NotificationType
from ...services import Service
from ..board.scopes import project_role_finder
from .NotificationSettingForm import NotificationSettingForm, NotificationSettingTypeForm


@AppRouter.api.put("/notification/setting/all")
@AuthFilter.add
async def toggle_all_notification_subscription(
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_all(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/type")
@AuthFilter.add
async def toggle_all_type_notification_subscription(
    form: NotificationSettingTypeForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if form.notification_type not in NotificationType and form.notification_type not in NotificationType._member_names_:
        return JsonResponse(content={"notification_types": []}, status_code=status.HTTP_200_OK)

    notification_types = await service.user_notification_setting.toggle_type(
        user, form.channel, form.notification_type, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/project")
@AuthFilter.add
async def toggle_all_project_notification_subscription(
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_project(
        user, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/column")
@AuthFilter.add
async def toggle_all_column_notification_subscription(
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_column(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/card")
@AuthFilter.add
async def toggle_all_card_notification_subscription(
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_card(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/wiki")
@AuthFilter.add
async def toggle_all_wiki_notification_subscription(
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_wiki(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/project/{project_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_project_notification_subscription(
    project_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_project(
        user, form.channel, form.is_unsubscribed, project_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/project/{project_uid}/column/{column_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_column_notification_subscription(
    project_uid: str,
    column_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_column(
        user, form.channel, form.is_unsubscribed, project_uid, column_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/project/{project_uid}/card/{card_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_card_notification_subscription(
    project_uid: str,
    card_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_card(
        user, form.channel, form.is_unsubscribed, project_uid, card_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/notification/setting/project/{project_uid}/wiki/{wiki_uid}")
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], project_role_finder)
@AuthFilter.add
async def toggle_wiki_notification_subscription(
    project_uid: str,
    wiki_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_wiki(
        user, form.channel, form.is_unsubscribed, project_uid, wiki_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]},
        status_code=status.HTTP_200_OK,
    )
