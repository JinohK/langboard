from json import dumps as json_dumps
from typing import Any, Literal, cast, overload
from ...core.ai import Bot
from ...core.db import SnowflakeID
from ...core.routing import SocketTopic
from ...core.service import BaseService, SocketModelIdBaseResult, SocketModelIdService, SocketPublishModel
from ...core.setting import AppSetting, AppSettingType
from ...core.storage import FileModel
from ...core.utils.String import generate_random_string
from .RevertService import RevertService, RevertType
from .Types import TBotParam, TSettingParam


class AppSettingService(BaseService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "app_setting"

    @overload
    async def get_by_type(self, setting_type: AppSettingType, as_api: Literal[False]) -> AppSetting | None: ...
    @overload
    async def get_by_type(self, setting_type: AppSettingType, as_api: Literal[True]) -> dict[str, Any] | None: ...
    async def get_by_type(self, setting_type: AppSettingType, as_api: bool) -> AppSetting | dict[str, Any] | None:
        setting = await self._get_by(AppSetting, "setting_type", setting_type)
        if not setting:
            return None
        if as_api:
            return setting.api_response()
        return setting

    @overload
    async def get_all_by_type(self, setting_type: AppSettingType, as_api: Literal[False]) -> list[AppSetting]: ...
    @overload
    async def get_all_by_type(self, setting_type: AppSettingType, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all_by_type(
        self, setting_type: AppSettingType, as_api: bool
    ) -> list[AppSetting] | list[dict[str, Any]]:
        settings = await self._get_all_by(AppSetting, "setting_type", setting_type)
        if as_api:
            return [setting.api_response() for setting in settings]
        return list(settings)

    @overload
    async def get_all(self, as_api: Literal[False]) -> list[AppSetting]: ...
    @overload
    async def get_all(self, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_all(self, as_api: bool) -> list[AppSetting] | list[dict[str, Any]]:
        settings = await self._get_all(AppSetting)
        if as_api:
            return [setting.api_response() for setting in settings]
        return list(settings)

    @overload
    async def get_bots(self, as_api: Literal[False]) -> list[Bot]: ...
    @overload
    async def get_bots(self, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_bots(self, as_api: bool) -> list[Bot] | list[dict[str, Any]]:
        bots = await self._get_all(Bot)
        if as_api:
            return [bot.api_response() for bot in bots]
        return list(bots)

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = await self._get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

    async def create(
        self, setting_type: AppSettingType, setting_name: str, setting_value: Any
    ) -> tuple[str, AppSetting]:
        json_value = json_dumps(setting_value, default=str)
        setting = AppSetting(setting_type=setting_type, setting_name=setting_name, setting_value=json_value)

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(unsaved_model=setting, revert_type=RevertType.Delete)
        )

        return revert_key, setting

    async def update(
        self, setting: TSettingParam, setting_name: str | None = None, setting_value: Any | None = None
    ) -> str | Literal[True] | None:
        setting = cast(AppSetting, await self._get_by_param(AppSetting, setting))
        if not setting:
            return None

        if setting_name:
            setting.setting_name = setting_name
        if setting_value and not setting.is_immutable_type():
            setting.setting_value = json_dumps(setting_value, default=str)

        if not setting.has_changes():
            return True

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(unsaved_model=setting, revert_type=RevertType.Update)
        )

        return revert_key

    async def delete(self, setting: TSettingParam) -> str | None:
        setting = cast(AppSetting, await self._get_by_param(AppSetting, setting))
        if not setting:
            return None

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(unsaved_model=setting, revert_type=RevertType.Insert)
        )

        return revert_key

    async def delete_selected(self, uids: list[str]) -> str | None:
        ids: list[SnowflakeID] = [SnowflakeID.from_short_code(uid) for uid in uids]

        settings = await self._get_all_by(AppSetting, "id", ids)
        if not settings:
            return None

        revert_service = self._get_service(RevertService)
        record_models = [
            revert_service.create_record_model(unsaved_model=setting, revert_type=RevertType.Insert)
            for setting in settings
        ]
        revert_key = await revert_service.record(*record_models)

        return revert_key

    async def create_bot(
        self, name: str, bot_uname: str, avatar: FileModel | None = None
    ) -> SocketModelIdBaseResult[tuple[str, Bot]] | None:
        existing_bot = await self._get_by(Bot, "bot_uname", bot_uname)
        if existing_bot:
            return None

        bot = Bot(
            name=name,
            bot_uname=bot_uname,
            avatar=avatar,
        )

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(
                unsaved_model=bot, revert_type=RevertType.Delete, file_columns=["avatar"]
            )
        )

        model_id = await SocketModelIdService.create_model_id({"bot": bot.api_response()})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id="all",
            event="settings:bot:created",
            data_keys="bot",
        )

        return SocketModelIdBaseResult(model_id, (revert_key, bot), publish_model)

    async def update_bot(
        self, bot: TBotParam, form: dict
    ) -> tuple[bool, Bot | None] | SocketModelIdBaseResult[tuple[str, Bot, dict[str, Any]]] | None:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return None
        mutable_keys = ["name", "bot_uname", "avatar"]

        old_bot_record = {}

        for key in mutable_keys:
            if key not in form or not hasattr(bot, key):
                continue
            old_value = getattr(bot, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_bot_record[key] = self._convert_to_python(old_value)
            setattr(bot, key, new_value)

        if "bot_uname" in form:
            existing_bot = await self._get_by(Bot, "bot_uname", form["bot_uname"])
            if existing_bot:
                return False, None

        if "delete_avatar" in form and form["delete_avatar"]:
            old_bot_record["avatar"] = self._convert_to_python(bot.avatar)
            bot.avatar = None

        if not old_bot_record:
            return True, bot

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(
                unsaved_model=bot, revert_type=RevertType.Update, file_columns=["avatar"]
            )
        )

        model: dict[str, Any] = {}
        for key in form:
            if key not in mutable_keys or key not in old_bot_record:
                continue
            if key == "avatar":
                if bot.avatar:
                    model[key] = bot.avatar.path
                else:
                    model["deleted_avatar"] = True
            else:
                model[key] = self._convert_to_python(getattr(bot, key))

        model_id = await SocketModelIdService.create_model_id({**model})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id="all",
            event=f"settings:bot:updated:{bot.get_uid()}",
            data_keys=list(model.keys()),
        )

        return SocketModelIdBaseResult(model_id, (revert_key, bot, model), publish_model)

    async def delete_bot(self, bot: TBotParam) -> SocketModelIdBaseResult[str] | None:
        bot = cast(Bot, await self._get_by_param(Bot, bot))
        if not bot:
            return None

        revert_service = self._get_service(RevertService)
        revert_key = await revert_service.record(
            revert_service.create_record_model(
                unsaved_model=bot, revert_type=RevertType.Insert, file_columns=["avatar"]
            )
        )

        model_id = await SocketModelIdService.create_model_id({"fake": True})

        publish_model = SocketPublishModel(
            topic=SocketTopic.Global,
            topic_id="all",
            event=f"settings:bot:deleted:{bot.get_uid()}",
        )

        return SocketModelIdBaseResult(model_id, revert_key, publish_model)
