from fastapi import File, UploadFile, status
from ...core.ai import Bot
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.security import Auth
from ...core.setting import AppSetting, AppSettingType
from ...core.storage import Storage, StorageName
from ...models import GlobalCardRelationshipType
from ...services import Service
from .Form import (
    CreateBotForm,
    CreateGlobalRelationshipTypeForm,
    CreateSettingForm,
    DeleteSelectedGlobalRelationshipTypesForm,
    DeleteSelectedSettingsForm,
    PredefineBotTriggerConditionForm,
    ToggleBotTriggerConditionForm,
    UpdateBotForm,
    UpdateGlobalRelationshipTypeForm,
    UpdateSettingForm,
)


@AppRouter.api.post("/settings/available", tags=["AppSettings"], responses=OpenApiSchema().auth().only_admin().get())
@AuthFilter.add
async def is_settings_available(user_or_bot: User | Bot = Auth.scope("api")) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get(
    "/settings/all",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "settings": [AppSetting],
                "bots": [Bot],
                "global_relationships": [GlobalCardRelationshipType],
            }
        )
        .auth()
        .only_admin()
        .get()
    ),
)
@AuthFilter.add
async def get_all_settings(
    user_or_bot: User | Bot = Auth.scope("api"), service: Service = Service.scope()
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    await service.app_setting.init_langflow()

    settings = await service.app_setting.get_all(as_api=True)
    bots = await service.bot.get_list(as_api=True, is_setting=True)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)

    return JsonResponse(
        content={"settings": settings, "bots": bots, "global_relationships": global_relationships},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.post(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"setting": AppSetting, "revealed_value": "string"}).auth().only_admin().get(),
)
@AuthFilter.add
async def create_setting(
    form: CreateSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if form.setting_type == AppSettingType.ApiKey:
        form.setting_value = await service.app_setting.generate_api_key()

    setting = await service.app_setting.create(form.setting_type, form.setting_name, form.setting_value)
    revealed_value = setting.get_value()

    return JsonResponse(
        content={"setting": setting.api_response(), "revealed_value": revealed_value}, status_code=status.HTTP_200_OK
    )


@AppRouter.api.put(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Setting not found.").get(),
)
@AuthFilter.add
async def update_setting(
    setting_uid: str,
    form: UpdateSettingForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.update(setting_uid, form.setting_name, form.setting_value)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if result is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Setting not found.").get(),
)
@AuthFilter.add
async def delete_setting(
    setting_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete(setting_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Settings not found.").get(),
)
@AuthFilter.add
async def delete_selected_settings(
    form: DeleteSelectedSettingsForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_selected(form.setting_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/settings/bot",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"bot": (Bot, {"is_setting": True}), "revealed_app_api_token": "string"})
        .auth()
        .only_admin()
        .err(409, "Bot uname already exists.")
        .get()
    ),
)
@AuthFilter.add
async def create_bot(
    form: CreateBotForm = CreateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    uploaded_avatar = None
    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        uploaded_avatar = file_model

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "").split(",")
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
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    return JsonResponse(
        content={"bot": bot.api_response(is_setting=True), "revealed_app_api_token": bot.app_api_token},
        status_code=status.HTTP_200_OK,
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
        .only_admin()
        .err(404, "Bot not found.")
        .err(409, "Bot uname already exists.")
        .get()
    ),
)
@AuthFilter.add
async def update_bot(
    bot_uid: str,
    form: UpdateBotForm = UpdateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    form_dict = form.model_dump()
    if "bot_name" in form_dict:
        form_dict["name"] = form_dict.pop("bot_name")

    if "ip_whitelist" in form_dict:
        form_dict.pop("ip_whitelist")

    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = await service.bot.update(bot_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "").split(",")
        result = await service.bot.update_ip_whitelist(bot_uid, ip_whitelist)
        if not result:
            return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        if not result:
            return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    _, model = result

    return JsonResponse(content=model, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/settings/bot/{bot_uid}/new-api-token",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc({"secret_app_api_token": "string", "revealed_app_api_token": "string"})
        .auth()
        .only_admin()
        .err(404, "Bot not found.")
        .get()
    ),
)
@AuthFilter.add
async def generate_new_bot_api_token(
    bot_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    bot = await service.bot.generate_new_api_token(bot_uid)
    if not bot:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(
        content={
            "secret_app_api_token": bot.api_response(is_setting=True)["app_api_token"],
            "revealed_app_api_token": bot.app_api_token,
        },
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put(
    "/settings/bot/predefine-trigger-condition",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Bot not found.").get(),
)
@AuthFilter.add
async def predefine_bot_trigger_condition(
    form: PredefineBotTriggerConditionForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, Bot):
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    bot = await service.bot.predefine_conditions(user_or_bot, form.conditions)
    if not bot:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.put(
    "/settings/bot/{bot_uid}/trigger-condition",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Bot not found.").get(),
)
@AuthFilter.add
async def toggle_bot_trigger_condition(
    bot_uid: str,
    form: ToggleBotTriggerConditionForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    bot = await service.bot.toggle_condition(bot_uid, form.condition)
    if not bot:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/settings/bot/{bot_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Bot not found.").get(),
)
@AuthFilter.add
async def delete_bot(
    bot_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.bot.delete(bot_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.post(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"global_relationship": GlobalCardRelationshipType}).auth().only_admin().get(),
)
@AuthFilter.add
async def create_global_relationship(
    form: CreateGlobalRelationshipTypeForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    global_relationship = await service.app_setting.create_global_relationship(
        form.parent_name, form.child_name, form.description
    )

    return JsonResponse(
        content={"global_relationship": global_relationship.api_response()},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put(
    "/settings/global-relationship/{global_relationship_uid}",
    tags=["AppSettings"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "parent_name?": "string",
                "child_name?": "string",
                "description?": "string",
            }
        )
        .auth()
        .only_admin()
        .err(404, "Global relationship not found.")
        .get()
    ),
)
@AuthFilter.add
async def update_global_relationship(
    global_relationship_uid: str,
    form: UpdateGlobalRelationshipTypeForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    form_dict = form.model_dump()

    result = await service.app_setting.update_global_relationship(global_relationship_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    _, model = result

    return JsonResponse(content={**model}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/settings/global-relationship/{global_relationship_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Global relationship not found.").get(),
)
@AuthFilter.add
async def delete_global_relationship(
    global_relationship_uid: str,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_global_relationship(global_relationship_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().only_admin().err(404, "Global relationships not found.").get(),
)
@AuthFilter.add
async def delete_selected_global_relationship(
    form: DeleteSelectedGlobalRelationshipTypesForm,
    user_or_bot: User | Bot = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not isinstance(user_or_bot, User) or not user_or_bot.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_selected_global_relationships(form.relationship_type_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={}, status_code=status.HTTP_200_OK)
