from fastapi import File, UploadFile, status
from ...Constants import QUERY_NAMES
from ...core.caching import Cache
from ...core.routing import AppRouter, JsonResponse
from ...core.storage import Storage, StorageName
from ...services import Service
from .scopes import ActivateUserForm, CheckEmailForm, ResendLinkForm, SignUpForm


@AppRouter.api.post("/auth/signup/exist/email")
async def exist_email(form: CheckEmailForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    return JsonResponse(content={"exists": user is not None})


@AppRouter.api.post("/auth/signup")
async def signup(
    form: SignUpForm = SignUpForm.scope(), avatar: UploadFile | None = File(None), service: Service = Service.scope()
) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    if user:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    file_model = Storage.upload(avatar, StorageName.Avatar) if avatar else None
    user = await service.user.create(form.model_dump(), avatar=file_model)

    cache_key = service.user.create_cache_name("signup", user.email)

    token_url = await service.user.create_token_url(user, cache_key, QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN)

    result = await service.email.send_template(user.preferred_lang, user.email, "signup", {"url": token_url})
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    # TODO: Email, Remove url after email feature is implemented
    return JsonResponse(content={"url": token_url})


@AppRouter.api.post("/auth/signup/resend")
async def resend_link(form: ResendLinkForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_email(form.email)
    if not user:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if user.activated_at:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    cache_key = service.user.create_cache_name("signup", user.email)

    await Cache.delete(cache_key)

    token_url = await service.user.create_token_url(user, cache_key, QUERY_NAMES.SIGN_UP_ACTIVATE_TOKEN)

    result = await service.email.send_template(user.preferred_lang, user.email, "signup", {"url": token_url})
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    # TODO: Email, Remove url after email feature is implemented
    return JsonResponse(content={"url": token_url})


@AppRouter.api.post("/auth/signup/activate")
async def activate(form: ActivateUserForm, service: Service = Service.scope()) -> JsonResponse:
    user, cache_key, _ = await service.user.validate_token_from_url("signup", form.signup_token)
    if not user or not cache_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if user.activated_at:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    await service.user.activate(user)

    await Cache.delete(cache_key)

    return JsonResponse(content={"email": user.email})
