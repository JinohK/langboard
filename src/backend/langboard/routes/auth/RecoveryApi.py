from fastapi import status
from ...Constants import QUERY_NAMES
from ...core.caching import Cache
from ...core.routing import AppRouter, JsonResponse
from ...core.routing.Exception import InvalidError, InvalidException
from ...core.utils.String import make_fullname
from ...services import Service
from .scopes import ResetPasswordForm, SendResetLinkForm, ValidateTokenForm


@AppRouter.api.post("/auth/recovery/send")
async def send_link(form: SendResetLinkForm, service: Service = Service.scope()) -> JsonResponse:
    user, _ = await service.user.get_by_token(form.email_token, form.sign_token)
    if not user:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    cache_key = service.user.create_cache_name("recovery", user.email)

    if form.is_resend:
        recovery_cache = await Cache.get(cache_key)
        if not recovery_cache or user.get_fullname() != recovery_cache["name"]:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)
        await Cache.delete(cache_key)
    else:
        if user.get_fullname() != make_fullname(form.firstname, form.lastname):
            raise InvalidException(InvalidError(loc="body", field="name", inputs=form.model_dump()))

    token_url = await service.user.create_token_url(user, cache_key, QUERY_NAMES.RECOVERY_TOKEN)

    result = await service.email.send_template(user.preferred_lang, user.email, "recovery", {"url": token_url})
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    # TODO: Email, Remove url after email feature is implemented
    return JsonResponse(content={"url": token_url})


@AppRouter.api.post("/auth/recovery/validate")
async def validate_recovery_token(form: ValidateTokenForm, service: Service = Service.scope()) -> JsonResponse:
    user, _, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"email": user.email})


@AppRouter.api.post("/auth/recovery/reset")
async def change_password(form: ResetPasswordForm, service: Service = Service.scope()) -> JsonResponse:
    user, cache_key, _ = await service.user.validate_token_from_url("recovery", form.recovery_token)
    if not user or not cache_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    await service.user.change_password(user, form.password)

    await Cache.delete(cache_key)

    return JsonResponse(content={})
