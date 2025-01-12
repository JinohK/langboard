from fastapi import File, UploadFile, status
from ...core.db import User
from ...core.filter import AuthFilter
from ...core.routing import AppRouter, JsonResponse
from ...core.security import Auth
from ...core.setting import AppSettingType
from ...core.storage import Storage, StorageName
from ...services import Service
from .Form import (
    CreateBotForm,
    CreateGlobalRelationshipTypeForm,
    CreateSettingForm,
    DeleteSelectedGlobalRelationshipTypesForm,
    DeleteSelectedSettingsForm,
    UpdateBotForm,
    UpdateGlobalRelationshipTypeForm,
    UpdateSettingForm,
)


@AppRouter.api.post("/settings/available")
@AuthFilter.add
async def is_settings_available(user: User = Auth.scope("api")) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)
    return JsonResponse(content={}, status_code=status.HTTP_200_OK)


@AppRouter.api.get("/settings/all")
@AuthFilter.add
async def get_all_settings(user: User = Auth.scope("api"), service: Service = Service.scope()) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    await service.app_setting.init_langflow()

    settings = await service.app_setting.get_all(as_api=True)
    bots = await service.app_setting.get_bots(as_api=True)
    global_relationships = await service.app_setting.get_global_relationships(as_api=True)

    return JsonResponse(
        content={"settings": settings, "bots": bots, "global_relationships": global_relationships},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.post("/settings/app")
@AuthFilter.add
async def create_setting(
    form: CreateSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    if form.setting_type == AppSettingType.ApiKey:
        form.setting_value = await service.app_setting.generate_api_key()

    revert_key, setting = await service.app_setting.create(form.setting_type, form.setting_name, form.setting_value)
    revealed_value = setting.get_value()

    return JsonResponse(
        content={"revert_key": revert_key, "setting": setting.api_response(), "revealed_value": revealed_value},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/settings/app/{setting_uid}")
@AuthFilter.add
async def update_setting(
    setting_uid: str,
    form: UpdateSettingForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    revert_key = await service.app_setting.update(setting_uid, form.setting_name, form.setting_value)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if revert_key is True:
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    return JsonResponse(content={"revert_key": revert_key}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/settings/app/{setting_uid}")
@AuthFilter.add
async def delete_setting(
    setting_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    revert_key = await service.app_setting.delete(setting_uid)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": revert_key}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/settings/app")
@AuthFilter.add
async def delete_selected_settings(
    form: DeleteSelectedSettingsForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    revert_key = await service.app_setting.delete_selected(form.setting_uids)
    if not revert_key:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": revert_key}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/settings/bot")
@AuthFilter.add
async def create_bot(
    form: CreateBotForm = CreateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    uploaded_avatar = None
    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        uploaded_avatar = file_model

    result = await service.app_setting.create_bot(form.bot_name, form.bot_uname, uploaded_avatar)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    revert_key, bot = result

    return JsonResponse(content={"revert_key": revert_key, "bot": bot.api_response()}, status_code=status.HTTP_200_OK)


@AppRouter.api.put("/settings/bot/{bot_uid}")
@AuthFilter.add
async def update_bot(
    bot_uid: str,
    form: UpdateBotForm = UpdateBotForm.scope(),
    avatar: UploadFile | None = File(None),
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    form_dict = form.model_dump()
    if "bot_name" in form_dict:
        form_dict["name"] = form_dict.pop("bot_name")

    file_model = Storage.upload(avatar, StorageName.BotAvatar) if avatar else None
    if file_model:
        form_dict["avatar"] = file_model

    result = await service.app_setting.update_bot(bot_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        if not result:
            return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    revert_key, _, model = result

    return JsonResponse(content={"revert_key": revert_key, **model}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/settings/bot/{bot_uid}")
@AuthFilter.add
async def delete_bot(
    bot_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_bot(bot_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": result}, status_code=status.HTTP_200_OK)


@AppRouter.api.post("/settings/global-relationship")
@AuthFilter.add
async def create_global_relationship(
    form: CreateGlobalRelationshipTypeForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.create_global_relationship(form.parent_name, form.child_name, form.description)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)

    revert_key, global_relationship = result

    return JsonResponse(
        content={"revert_key": revert_key, "global_relationship": global_relationship.api_response()},
        status_code=status.HTTP_200_OK,
    )


@AppRouter.api.put("/settings/global-relationship/{global_relationship_uid}")
@AuthFilter.add
async def update_global_relationship(
    global_relationship_uid: str,
    form: UpdateGlobalRelationshipTypeForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    form_dict = form.model_dump()

    result = await service.app_setting.update_global_relationship(global_relationship_uid, form_dict)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    if isinstance(result, bool):
        if not result:
            return JsonResponse(content={}, status_code=status.HTTP_409_CONFLICT)
        return JsonResponse(content={}, status_code=status.HTTP_200_OK)

    revert_key, _, model = result

    return JsonResponse(content={"revert_key": revert_key, **model}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/settings/global-relationship/{global_relationship_uid}")
@AuthFilter.add
async def delete_global_relationship(
    global_relationship_uid: str,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_global_relationship(global_relationship_uid)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": result}, status_code=status.HTTP_200_OK)


@AppRouter.api.delete("/settings/global-relationship")
@AuthFilter.add
async def delete_selected_global_relationship(
    form: DeleteSelectedGlobalRelationshipTypesForm,
    user: User = Auth.scope("api"),
    service: Service = Service.scope(),
) -> JsonResponse:
    if not user.is_admin:
        return JsonResponse(content={}, status_code=status.HTTP_403_FORBIDDEN)

    result = await service.app_setting.delete_selected_global_relationships(form.relationship_type_uids)
    if not result:
        return JsonResponse(content={}, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"revert_key": result}, status_code=status.HTTP_200_OK)
