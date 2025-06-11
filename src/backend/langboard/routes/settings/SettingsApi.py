from fastapi import File, UploadFile, status
from ...core.filter import AuthFilter
from ...core.routing import ApiErrorCode, AppRouter, JsonResponse
from ...core.schema import OpenApiSchema
from ...core.storage import Storage, StorageName
from ...models import AppSetting, Bot, GlobalCardRelationshipType
from ...models.AppSetting import AppSettingType
from ...security import Auth
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


@AppRouter.api.post("/settings/available", tags=["AppSettings"], responses=OpenApiSchema().auth().forbidden().get())
@AuthFilter.add("admin")
async def is_settings_available() -> JsonResponse:
    return JsonResponse()


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
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("admin")
async def get_all_settings(service: Service = Service.scope()) -> JsonResponse:
    await service.app_setting.init_langflow()

    settings = await service.app_setting.get_all(as_api=True)
    bots = await service.bot.get_list(as_api=True, is_setting=True)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)

    return JsonResponse(content={"settings": settings, "bots": bots, "global_relationships": global_relationships})


@AppRouter.api.post(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"setting": AppSetting, "revealed_value": "string"}, 201).auth().forbidden().get(),
)
@AuthFilter.add("admin")
async def create_setting(form: CreateSettingForm, service: Service = Service.scope()) -> JsonResponse:
    if form.setting_type == AppSettingType.ApiKey:
        form.setting_value = await service.app_setting.generate_api_key()

    setting = await service.app_setting.create(form.setting_type, form.setting_name, form.setting_value)
    revealed_value = setting.get_value()

    return JsonResponse(
        content={"setting": setting.api_response(), "revealed_value": revealed_value},
        status_code=status.HTTP_201_CREATED,
    )


@AppRouter.api.put(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def update_setting(setting_uid: str, form: UpdateSettingForm, service: Service = Service.scope()) -> JsonResponse:
    result = await service.app_setting.update(setting_uid, form.setting_name, form.setting_value)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app/{setting_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def delete_setting(setting_uid: str, service: Service = Service.scope()) -> JsonResponse:
    result = await service.app_setting.delete(setting_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/app",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3002).get(),
)
@AuthFilter.add("admin")
async def delete_selected_settings(
    form: DeleteSelectedSettingsForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.app_setting.delete_selected(form.setting_uids)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3002, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


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
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    if form.ip_whitelist is not None:
        ip_whitelist = form.ip_whitelist.strip().replace(" ", "").split(",")
        ip_result = await service.bot.update_ip_whitelist(bot_uid, ip_whitelist)
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


@AppRouter.schema(form=PredefineBotTriggerConditionForm)
@AppRouter.api.put(
    "/settings/bot/trigger-condition/predefine",
    tags=["AppSettings"],
    description="Predefine bot trigger conditions.",
    responses=OpenApiSchema().auth(only_bot=True).forbidden().err(404, ApiErrorCode.NF3001).get(),
)
@AuthFilter.add("bot")
async def predefine_bot_trigger_condition(
    form: PredefineBotTriggerConditionForm, bot: Bot = Auth.scope("api_bot"), service: Service = Service.scope()
) -> JsonResponse:
    result = await service.bot.predefine_conditions(bot, form.conditions)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.put(
    "/settings/bot/{bot_uid}/trigger-condition",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3001).get(),
)
@AuthFilter.add("admin")
async def toggle_bot_trigger_condition(
    bot_uid: str, form: ToggleBotTriggerConditionForm, service: Service = Service.scope()
) -> JsonResponse:
    bot = await service.bot.toggle_condition(bot_uid, form.condition)
    if not bot:
        return JsonResponse(content=ApiErrorCode.NF3001, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


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


@AppRouter.api.post(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().suc({"global_relationship": GlobalCardRelationshipType}, 201).auth().forbidden().get(),
)
@AuthFilter.add("admin")
async def create_global_relationship(
    form: CreateGlobalRelationshipTypeForm, service: Service = Service.scope()
) -> JsonResponse:
    global_relationship = await service.app_setting.create_global_relationship(
        form.parent_name, form.child_name, form.description
    )

    return JsonResponse(
        content={"global_relationship": global_relationship.api_response()}, status_code=status.HTTP_201_CREATED
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
        .forbidden()
        .err(404, ApiErrorCode.NF3003)
        .get()
    ),
)
@AuthFilter.add("admin")
async def update_global_relationship(
    global_relationship_uid: str, form: UpdateGlobalRelationshipTypeForm, service: Service = Service.scope()
) -> JsonResponse:
    form_dict = form.model_dump()

    result = await service.app_setting.update_global_relationship(global_relationship_uid, form_dict)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        return JsonResponse()

    _, model = result

    return JsonResponse(content={**model})


@AppRouter.api.delete(
    "/settings/global-relationship/{global_relationship_uid}",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3003).get(),
)
@AuthFilter.add("admin")
async def delete_global_relationship(global_relationship_uid: str, service: Service = Service.scope()) -> JsonResponse:
    result = await service.app_setting.delete_global_relationship(global_relationship_uid)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()


@AppRouter.api.delete(
    "/settings/global-relationship",
    tags=["AppSettings"],
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF3003).get(),
)
@AuthFilter.add("admin")
async def delete_selected_global_relationship(
    form: DeleteSelectedGlobalRelationshipTypesForm, service: Service = Service.scope()
) -> JsonResponse:
    result = await service.app_setting.delete_selected_global_relationships(form.relationship_type_uids)
    if not result:
        return JsonResponse(content=ApiErrorCode.NF3003, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse()
