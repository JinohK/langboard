from typing import Annotated
from fastapi import Header, status
from jwt import ExpiredSignatureError
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...core.utils.Encryptor import Encryptor
from ...models.UserNotificationUnsubscription import NotificationScope
from ...services import Service
from .scopes import AuthEmailForm, AuthEmailResponse, RefreshResponse, SignInForm, SignInResponse


@AppRouter.api.post("/auth/email", response_model=AuthEmailResponse)
async def auth_email(form: AuthEmailForm, service: Service = Service.scope()) -> JsonResponse | AuthEmailResponse:
    if form.is_token:
        user, subemail = await service.user.get_by_token(form.token, form.sign_token)
    else:
        user, subemail = await service.user.get_by_email(form.email)

    if subemail and not subemail.verified_at:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    if not user:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    token = Encryptor.encrypt(user.email, form.sign_token)
    return AuthEmailResponse(token=token, email=user.email)


@AppRouter.api.post("/auth/signin", response_model=SignInResponse)
async def sign_in(form: SignInForm, service: Service = Service.scope()) -> JsonResponse | SignInResponse:
    user, subemail = await service.user.get_by_token(form.email_token, form.sign_token)

    if not user:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if subemail and not subemail.verified_at:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    if not user.check_password(form.password):
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not user.activated_at:
        return JsonResponse(content={}, status_code=status.HTTP_423_LOCKED)

    access_token, refresh_token = Auth.authenticate(user.id)

    return SignInResponse(access_token=access_token, refresh_token=refresh_token)


@AppRouter.api.post("/auth/refresh", response_model=RefreshResponse)
async def refresh(refresh_token: Annotated[str, Header()]) -> JsonResponse | RefreshResponse:
    try:
        new_access_token = Auth.refresh(refresh_token)
        user = await Auth.get_user_by_token(new_access_token)

        if not user:
            raise Exception()
    except ExpiredSignatureError:
        return JsonResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception:
        return JsonResponse(content={}, status_code=status.HTTP_401_UNAUTHORIZED)

    return RefreshResponse(access_token=new_access_token)


@AppRouter.api.get("/auth/me")
@AuthFilter.add
async def about_me(user: User = Auth.scope("api"), service: Service = Service.scope()) -> JsonResponse:
    profile = await service.user.get_profile(user)
    response = {
        **user.api_response(),
        **profile.api_response(),
        "preferred_lang": user.preferred_lang,
    }
    response["user_groups"] = await service.user_group.get_all_by_user(user, as_api=True)
    response["subemails"] = await service.user.get_subemails(user)
    notifications = await service.notification.get_list(user)

    notification_unsubs = await service.user_notification_setting.get_unsubscriptions_query_builder(user).all()
    unsubs = {}
    for unsub in notification_unsubs:
        if unsub.scope_type.value not in unsubs:
            unsubs[unsub.scope_type.value] = {}
        if unsub.notification_type.value not in unsubs[unsub.scope_type.value]:
            unsubs[unsub.scope_type.value][unsub.notification_type.value] = {}

        if unsub.scope_type.value == NotificationScope.All.value:
            unsubs[unsub.scope_type.value][unsub.notification_type.value][unsub.channel.value] = True
            continue

        if not unsub.specific_id:
            continue

        unsubs[unsub.scope_type.value][unsub.notification_type.value][unsub.channel.value] = []
        unsubs[unsub.scope_type.value][unsub.notification_type.value][unsub.channel.value].append(
            unsub.specific_id.to_short_code()
        )

    response["notification_unsubs"] = unsubs

    if user.is_admin:
        response["is_admin"] = True

    return JsonResponse(content={"user": response, "notifications": notifications})
