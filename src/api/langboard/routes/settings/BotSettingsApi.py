from core.filter import AuthFilter
from core.routing import ApiErrorCode, AppRouter, JsonResponse
from core.schema import OpenApiSchema
from core.storage import StorageName
from fastapi import File, UploadFile, status
from models import Bot
from ...core.storage import Storage
from ...services import Service
from .Form import CreateBotForm, UpdateBotForm


@AppRouter.api.post(
    "/settings/bot",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"bot": (Bot, {"is_setting": True}), "revealed_app_api_token": "string"}, 201)
        .auth()
        .forbidden()
        .err(409, ApiErrorCode.EX3001)
        .get()
    ),
)
@AuthFilter.add("admin")
async def create_bot(
    form: CreateBotForm = CreateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: Service = Service.scope(),
) -> JsonResponse:
    uploaded_avatar = None
    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        uploaded_avatar = file_model

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "")
        ip_whitelist = ip_whitelist.split(",") if ip_whitelist else []
    else:
        ip_whitelist = []

    bot = await service.bot.create(
        form.bot_name,
        form.bot_uname,
        form.api_url,
        form.api_auth_type,
        form.api_key,
        ip_whitelist,
        form.prompt,
        uploaded_avatar,
    )
    if not bot:
        return JsonResponse(content=ApiErrorCode.EX3001, status_code=status.HTTP_409_CONFLICT)

    return JsonResponse(
        content={"bot": bot.api_response(is_setting=True), "revealed_app_api_token": bot.app_api_token},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/bot/{bot_uid}",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "name?": "string",
                "bot_uname?": "string",
                "avatar?": "string",
                "api_url?": "string",
                "api_key?": "string",
                "deleted_avatar?": "bool",
            }
        )
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .err(409, ApiErrorCode.EX3001)
        .get()
    ),
)
@AuthFilter.add("admin")
async def update_bot(
    bot_uid: str,
    form: UpdateBotForm = UpdateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    service: Service = Service.scope(),
) -> JsonResponse:
    bot = await service.bot.get_by_uid(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    form_dict = form.model_dump()
    if "bot_name" in form_dict:
        form_dict["name"] = form_dict.pop("bot_name")

    if "ip_whitelist" in form_dict:
        form_dict.pop("ip_whitelist")

    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = await service.bot.update(bot, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "")
        ip_whitelist = ip_whitelist.split(",") if ip_whitelist else []
        ip_result = await service.bot.update_ip_whitelist(bot, ip_whitelist)
        if not ip_result:
            return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        if not result:
            return JsonResponse(content=ApiErrorCode.EX3001, status_code=status.HTTP_409_CONFLICT)
        return JsonResponse()

    _, model = result

    return JsonResponse(content=model)


@AppRouter.api.put(
    "/settings/bot/{bot_uid}/new-api-token",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"secret_app_api_token": "string", "revealed_app_api_token": "string"})
        .auth()
        .forbidden()
        .err(404, ApiErrorCode.NF3001)
        .get()
    ),
)
@AuthFilter.add("admin")
async def generate_new_bot_api_token(bot_uid: str, service: Service = Service.scope()) -> JsonResponse:
    bot = await service.bot.generate_new_api_token(bot_uid)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={
            "secret_app_api_token": bot.api_response(is_setting=True)["app_api_token"],
            "revealed_app_api_token": bot.app_api_token,
        }
    )


@AppRouter.api.delete(
    "/settings/bot/{bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3001).get(),
)
@AuthFilter.add("admin")
async def delete_bot(bot_uid: str, service: Service = Service.scope()) -> JsonResponse:
    result = await service.bot.delete(bot_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
