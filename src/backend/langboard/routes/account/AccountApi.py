from fastapi import File, UploadFile, status
from ...Constants import QUERY_NAMES
from ...core.ai import Bot
from ...core.caching import Cache
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.routing.Exception import InvalidError, InvalidException
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...core.storage import Storage, StorageName
from ...models import UserGroup
from ...services import Service
from .AccountForm import (
    AddNewEmailForm,
    ChangePasswordForm,
    CreateUserGroupForm,
    EmailForm,
    UpdatePreferredLangForm,
    UpdateProfileForm,
    UpdateUserGroupAssignedEmailForm,
    VerifyNewEmailForm,
)


@AppRouter.api.put("/account/profile", tags=["Account"], responses=OpenApiSchema().auth().no_bot().get())
@AuthFilter.add
async def update_profile(
    form: UpdateProfileForm = UpdateProfileForm.scope(),
    avatar: UploadFile | None = File(None),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    form_dict = form.model_dump()
    if file_model:
        form_dict["avatar"] = file_model

    await service.user.update(user_or_bot, form_dict)

    return JsonResponse(content={})


@AppRouter.api.post(
    "/account/email",
    tags=["Account"],
    responses=(
        OpenApiSchema()
        .auth()
        .no_bot()
        .err(404, "User subemail not found or subemail's user and current user don't match.")
        .err(304, "User subemail is already verified.")
        .err(503, "Failed to send email.")
        .get()
    ),
)
@AuthFilter.add
async def add_new_email(
    form: AddNewEmailForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    cache_key = service.user.create_cache_name("subemail", user_or_bot.email)
    existed_user, subemail = await service.user.get_by_email(form.new_email)
    if not form.is_resend:
        if existed_user:
            raise InvalidException(InvalidError(loc="body", field="new_email", inputs=form.model_dump()))

        await service.user.create_subemail(user_or_bot.id, form.new_email)
    else:
        if not existed_user or existed_user.id != user_or_bot.id or not subemail:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

        if subemail.verified_at:
            return JsonResponse(content={}, status_code=status.HTTP_304_NOT_MODIFIED)

        await Cache.delete(cache_key)

    token_url = await service.user.create_token_url(
        user_or_bot, cache_key, QUERY_NAMES.SUB_EMAIL_VERIFY_TOKEN, {"email": form.new_email}
    )
    result = await service.email.send_template(
        user_or_bot.preferred_lang, form.new_email, "subemail", {"url": token_url}
    )
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    return JsonResponse(content={})


@AppRouter.api.post(
    "/account/email/verify",
    tags=["Account"],
    responses=OpenApiSchema()
    .auth()
    .no_bot()
    .err(404, "User subemail not found or subemail's user and current user don't match.")
    .err(409, "Subemail not found.")
    .err(304, "User subemail is already verified.")
    .get(),
)
@AuthFilter.add
async def verify_subemail(
    form: VerifyNewEmailForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    user, cache_key, extra = await service.user.validate_token_from_url("subemail", form.verify_token)
    if not user or not cache_key or not extra or "email" not in extra:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    existed_user, subemail = await service.user.get_by_email(extra["email"])

    if not existed_user or user.id != existed_user.id:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not subemail:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    if subemail.verified_at:
        return JsonResponse(content={}, status_code=status.HTTP_304_NOT_MODIFIED)

    await service.user.verify_subemail(subemail)

    await Cache.delete(cache_key)

    return JsonResponse(content={})


@AppRouter.api.put(
    "/account/email",
    tags=["Account"],
    responses=(
        OpenApiSchema()
        .auth()
        .no_bot()
        .err(404, "User subemail not found or subemail's user and current user don't match.")
        .err(423, "Subemail is not verified.")
        .err(304, "User subemail is already primary.")
        .get()
    ),
)
@AuthFilter.add
async def change_primary_email(
    form: EmailForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user_or_bot.id or not subemail:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not subemail.verified_at:
        return JsonResponse(content={}, status_code=status.HTTP_423_LOCKED)

    if existed_user.email == form.email:
        return JsonResponse(content={}, status_code=status.HTTP_304_NOT_MODIFIED)

    await service.user.change_primary_email(user_or_bot, subemail)
    return JsonResponse(content={})


@AppRouter.api.delete(
    "/account/email",
    tags=["Account"],
    responses=(
        OpenApiSchema()
        .auth()
        .no_bot()
        .err(404, "User subemail not found or subemail's user and current user don't match.")
        .err(406, "Primary email cannot be deleted.")
        .get()
    ),
)
@AuthFilter.add
async def delete_email(
    form: EmailForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user_or_bot.id or not subemail:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if existed_user.email == form.email:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    await service.user.delete_email(subemail)
    return JsonResponse(content={})


@AppRouter.api.put("/account/password", tags=["Account"], responses=OpenApiSchema().auth().no_bot().get())
@AuthFilter.add
async def change_password(
    form: ChangePasswordForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if not user_or_bot.check_password(form.current_password):
        raise InvalidException(InvalidError(loc="body", field="current_password", inputs=form.model_dump()))

    await service.user.change_password(user_or_bot, form.new_password)
    await Auth.reset_user(user_or_bot)

    return JsonResponse(content={})


@AppRouter.api.post(
    "/account/group",
    tags=["Account"],
    responses=(OpenApiSchema().suc({"user_group": (UserGroup, {"schema": {"users": [User]}})}).auth().no_bot().get()),
)
@AuthFilter.add
async def create_user_group(
    form: CreateUserGroupForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    group = await service.user_group.create(user_or_bot, form.name)
    api_group = group.api_response()
    api_group["users"] = await service.user_group.get_user_emails_by_group(group.id, as_api=True)
    return JsonResponse(content={"user_group": api_group})


@AppRouter.api.put(
    "/account/group/{group_uid}/name",
    tags=["Account"],
    responses=OpenApiSchema().auth().no_bot().err(404, "User group not found.").get(),
)
@AuthFilter.add
async def change_user_group_name(
    group_uid: str,
    form: CreateUserGroupForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.user_group.change_name(user_or_bot, group_uid, form.name)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.api.put(
    "/account/group/{group_uid}/emails",
    tags=["Account"],
    responses=OpenApiSchema().suc({"users": [User]}).auth().no_bot().err(404, "User group not found.").get(),
)
@AuthFilter.add
async def update_user_group_assigned_emails(
    group_uid: str,
    form: UpdateUserGroupAssignedEmailForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.user_group.update_assigned_emails(user_or_bot, group_uid, form.emails)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    group_users = await service.user_group.get_user_emails_by_group(group_uid, as_api=True)

    return JsonResponse(content={"users": group_users})


@AppRouter.api.delete(
    "/account/group/{group_uid}",
    tags=["Account"],
    responses=OpenApiSchema().auth().no_bot().err(404, "User group not found.").get(),
)
@AuthFilter.add
async def delete_user_group(
    group_uid: str, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.user_group.delete(user_or_bot, group_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})


@AppRouter.api.put(
    "/account/preferred-language",
    tags=["Account"],
    responses=OpenApiSchema().auth().no_bot().err(404, "Language code is invalid.").get(),
)
@AuthFilter.add
async def update_preferred_language(
    form: UpdatePreferredLangForm, user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.user.update_preferred_lang(user_or_bot, form.lang)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={})
