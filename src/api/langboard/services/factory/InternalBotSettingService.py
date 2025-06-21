from typing import Any, Literal, overload
from core.db import DbSession
from core.service import BaseService
from core.storage import FileModel
from models import InternalBotSetting
from models.InternalBotSetting import InternalBotPlatform, InternalBotPlatformRunningType, InternalBotType
from ...core.service import ServiceHelper
from ...publishers import InternalBotPublisher
from .Types import TInternalBotParam


class InternalBotSettingService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "internal_bot_setting"

    async def get_by_uid(self, uid: str) -> InternalBotSetting | None:
        return ServiceHelper.get_by_param(InternalBotSetting, uid)

    @overload
    async def get_list(self, as_api: Literal[False], is_setting: bool) -> list[InternalBotSetting]: ...
    @overload
    async def get_list(self, as_api: Literal[True], is_setting: bool) -> list[dict[str, Any]]: ...
    async def get_list(self, as_api: bool, is_setting: bool) -> list[InternalBotSetting] | list[dict[str, Any]]:
        internal_bot_settings = ServiceHelper.get_all(InternalBotSetting)
        if as_api:
            return [setting.api_response(is_setting=is_setting) for setting in internal_bot_settings]
        return internal_bot_settings

    async def create(
        self,
        bot_type: InternalBotType,
        display_name: str,
        platform: InternalBotPlatform,
        platform_running_type: InternalBotPlatformRunningType,
        url: str,
        value: str,
        api_key: str = "",
        avatar: FileModel | None = None,
    ) -> InternalBotSetting:
        setting = InternalBotSetting(
            bot_type=bot_type,
            display_name=display_name,
            platform=platform,
            platform_running_type=platform_running_type,
            url=url,
            api_key=api_key,
            value=value,
            avatar=avatar,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(setting)

        await InternalBotPublisher.created(setting)

        return setting

    async def update(self, setting: TInternalBotParam, form: dict) -> InternalBotSetting | Literal[True] | None:
        setting = ServiceHelper.get_by_param(InternalBotSetting, setting)
        if not setting:
            return None

        mutable_keys = ["display_name", "platform", "platform_running_type", "url", "api_key", "value", "avatar"]

        updated_keys = []

        for key in mutable_keys:
            if key not in form or not hasattr(setting, key):
                continue
            old_value = getattr(setting, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            setattr(setting, key, new_value)
            updated_keys.append(key)

        if "delete_avatar" in form and form["delete_avatar"]:
            setting.avatar = None
            updated_keys.append("avatar")

        if not updated_keys:
            return True

        with DbSession.use(readonly=False) as db:
            db.update(setting)

        await InternalBotPublisher.updated(setting)

        return setting
