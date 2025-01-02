from fastapi import File, UploadFile, status
from ...core.caching import Cache
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.routing.Exception import InvalidError, InvalidException
from ...core.security import Auth
from ...core.storage import Storage, StorageName
from ...services import Service
from .Form import (
    AddNewEmailForm,
    ChangePasswordForm,
    CreateUserGroupForm,
    EmailForm,
    UpdateProfileForm,
    UpdateUserGroupAssignedEmailForm,
    VerifyNewEmailForm,
)


@AppRouter.api.put("/account/profile")
@AuthFilter.add
async def update_profile(
    form: UpdateProfileForm = UpdateProfileForm.scope(),
    avatar: UploadFile | None = File(None),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    form_dict = form.model_dump()
    if file_model:
        form_dict["avatar"] = file_model

    revert_key = await service.user.update(user, form_dict)

    return JsonResponse(content={"revert_key": revert_key})


@AppRouter.api.post("/account/email")
@AuthFilter.add
async def add_new_email(
    form: AddNewEmailForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    cache_key = service.user.create_cache_name("subemail", user.email)
    existed_user, subemail = await service.user.get_by_email(form.new_email)
    if not form.is_resend:
        if existed_user:
            raise InvalidException(InvalidError(loc="body", field="new_email", inputs=form.model_dump()))

        await service.user.create_subemail(user.id, form.new_email)
    else:
        if not existed_user or existed_user.id != user.id or not subemail:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

        if subemail.verified_at:
            return JsonResponse(content={}, status_code=status.HTTP_304_NOT_MODIFIED)

        await Cache.delete(cache_key)

    token_url = await service.user.create_token_url(
        user, cache_key, form.url, form.verify_token_query_name, {"email": form.new_email}
    )
    result = await service.email.send_template(form.lang, form.new_email, "subemail", {"url": token_url})
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    # TODO: Email, Remove url after email feature is implemented
    return JsonResponse(content={"url": token_url})


@AppRouter.api.post("/account/email/verify")
@AuthFilter.add
async def activate(form: VerifyNewEmailForm, service: Service = Service.scope()) -> JsonResponse:
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


@AppRouter.api.put("/account/email")
@AuthFilter.add
async def change_primary_email(
    form: EmailForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user.id or not subemail:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if not subemail.verified_at:
        return JsonResponse(content={}, status_code=status.HTTP_423_LOCKED)

    if existed_user.email == form.email:
        return JsonResponse(content={}, status_code=status.HTTP_304_NOT_MODIFIED)

    revert_key = await service.user.change_primary_email(user, subemail)
    return JsonResponse(content={"revert_key": revert_key})


@AppRouter.api.delete("/account/email")
@AuthFilter.add
async def delete_email(
    form: EmailForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    existed_user, subemail = await service.user.get_by_email(form.email)
    if not existed_user or existed_user.id != user.id or not subemail:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if existed_user.email == form.email:
        return JsonResponse(content={}, status_code=status.HTTP_406_NOT_ACCEPTABLE)

    revert_key = await service.user.delete_email(subemail)
    return JsonResponse(content={"revert_key": revert_key})


@AppRouter.api.put("/account/password")
@AuthFilter.add
async def change_password(
    form: ChangePasswordForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.check_password(form.current_password):
        raise InvalidException(InvalidError(loc="body", field="current_password", inputs=form.model_dump()))

    await service.user.change_password(user, form.new_password)
    await Auth.reset_user(user)

    return JsonResponse(content={})


@AppRouter.api.post("/account/group")
@AuthFilter.add
async def create_user_group(
    form: CreateUserGroupForm, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    group, revert_key = await service.user_group.create(user, form.name)
    api_group = group.api_response()
    api_group["users"] = await service.user_group.get_user_emails_by_group(group.id, as_api=True)
    return JsonResponse(content={"revert_key": revert_key, "user_group": api_group})


@AppRouter.api.put("/account/group/{group_uid}/emails")
@AuthFilter.add
async def update_user_group_assigned_emails(
    group_uid: str,
    form: UpdateUserGroupAssignedEmailForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    revert_key = await service.user_group.update_assigned_emails(user, group_uid, form.emails)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    group_users = await service.user_group.get_user_emails_by_group(group_uid, as_api=True)

    return JsonResponse(content={"revert_key": revert_key, "users": group_users})


@AppRouter.api.delete("/account/group/{group_uid}")
@AuthFilter.add
async def delete_user_group(
    group_uid: str, user: User = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    revert_key = await service.user_group.delete(user, group_uid)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": revert_key})
