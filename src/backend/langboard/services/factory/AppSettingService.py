from json import dumps as json_dumps
from typing import Any, Literal, cast, overload
from ...core.db import DbSession, SnowflakeID, SqlBuilder
from ...core.service import BaseService
from ...core.setting import AppSetting, AppSettingType
from ...core.utils.Converter import convert_python_data
from ...core.utils.String import generate_random_string
from ...models import GlobalCardRelationshipType
from ...publishers import AppSettingPublisher
from .Types import TGlobalCardRelationshipTypeParam, TSettingParam


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
    async def get_global_relationships(self, as_api: Literal[False]) -> list[GlobalCardRelationshipType]: ...
    @overload
    async def get_global_relationships(self, as_api: Literal[True]) -> list[dict[str, Any]]: ...
    async def get_global_relationships(self, as_api: bool) -> list[GlobalCardRelationshipType] | list[dict[str, Any]]:
        global_relationships = await self._get_all(GlobalCardRelationshipType)
        if as_api:
            return [relationship.api_response() for relationship in global_relationships]
        return list(global_relationships)

    async def generate_api_key(self) -> str:
        api_key = f"sk-{generate_random_string(53)}"
        while True:
            is_existed = await self._get_by(AppSetting, "setting_value", json_dumps(api_key))
            if not is_existed:
                break
            api_key = f"sk-{generate_random_string(53)}"
        return api_key

    async def create(self, setting_type: AppSettingType, setting_name: str, setting_value: Any) -> AppSetting:
        setting = AppSetting(setting_type=setting_type, setting_name=setting_name)
        setting.set_value(setting_value)

        async with DbSession.use(readonly=False) as db:
            await db.insert(setting)

        return setting

    async def init_langflow(self):
        settings = await self._get_all_by(
            AppSetting, "setting_type", [AppSettingType.LangflowUrl, AppSettingType.LangflowApiKey]
        )
        settings_set = set([setting.setting_type for setting in settings])
        if len(settings_set) == 2:
            return

        if AppSettingType.LangflowUrl not in settings_set:
            await self.create(AppSettingType.LangflowUrl, "Langflow URL", "")
        if AppSettingType.LangflowApiKey not in settings_set:
            await self.create(AppSettingType.LangflowApiKey, "Langflow API Key", "")

    async def update(
        self, setting: TSettingParam, setting_name: str | None = None, setting_value: Any | None = None
    ) -> AppSetting | Literal[True] | None:
        setting = cast(AppSetting, await self._get_by_param(AppSetting, setting))
        if not setting:
            return None

        if setting_name:
            setting.setting_name = setting_name
        if setting_value and not setting.is_immutable_type():
            setting.set_value(setting_value)

        if not setting.has_changes():
            return True

        async with DbSession.use(readonly=False) as db:
            await db.update(setting)

        return setting

    async def delete(self, setting: TSettingParam) -> bool:
        setting = cast(AppSetting, await self._get_by_param(AppSetting, setting))
        if not setting:
            return False

        async with DbSession.use(readonly=False) as db:
            await db.delete(setting)
        return True

    async def delete_selected(self, uids: list[str]) -> bool:
        ids: list[SnowflakeID] = [SnowflakeID.from_short_code(uid) for uid in uids]

        async with DbSession.use(readonly=False) as db:
            await db.exec(SqlBuilder.delete.table(AppSetting).where(AppSetting.column("id").in_(ids)))

        return True

    async def create_global_relationship(
        self, parent_name: str, child_name: str, description: str = ""
    ) -> GlobalCardRelationshipType:
        global_relationship = GlobalCardRelationshipType(
            parent_name=parent_name,
            child_name=child_name,
            description=description,
        )

        async with DbSession.use(readonly=False) as db:
            await db.insert(global_relationship)

        model = {"global_relationships": global_relationship.api_response()}
        AppSettingPublisher.global_relationship_created(model)

        return global_relationship

    async def update_global_relationship(
        self, global_relationship: TGlobalCardRelationshipTypeParam, form: dict
    ) -> bool | tuple[GlobalCardRelationshipType, dict[str, Any]] | None:
        global_relationship = cast(
            GlobalCardRelationshipType, await self._get_by_param(GlobalCardRelationshipType, global_relationship)
        )
        if not global_relationship:
            return None
        mutable_keys = ["parent_name", "child_name", "description"]

        old_global_relationship_record = {}

        for key in form:
            if key not in mutable_keys:
                continue
            old_value = getattr(global_relationship, key)
            new_value = form[key]
            if old_value == new_value or new_value is None:
                continue
            old_global_relationship_record[key] = convert_python_data(old_value)
            setattr(global_relationship, key, new_value)

        if not old_global_relationship_record:
            return True

        async with DbSession.use(readonly=False) as db:
            await db.update(global_relationship)

        model = {}
        for key in form:
            if key not in mutable_keys or key not in old_global_relationship_record:
                continue
            model[key] = convert_python_data(getattr(global_relationship, key))

        AppSettingPublisher.global_relationship_updated(global_relationship.get_uid(), model)

        return global_relationship, model

    async def delete_global_relationship(self, global_relationship: TGlobalCardRelationshipTypeParam) -> bool:
        global_relationship = cast(
            GlobalCardRelationshipType, await self._get_by_param(GlobalCardRelationshipType, global_relationship)
        )
        if not global_relationship:
            return False

        async with DbSession.use(readonly=False) as db:
            await db.delete(global_relationship)

        AppSettingPublisher.global_relationship_deleted(global_relationship.get_uid())

        return True

    async def delete_selected_global_relationships(self, uids: list[str]) -> bool:
        ids: list[SnowflakeID] = [SnowflakeID.from_short_code(uid) for uid in uids]

        async with DbSession.use(readonly=False) as db:
            await db.exec(
                SqlBuilder.delete.table(GlobalCardRelationshipType).where(
                    GlobalCardRelationshipType.column("id").in_(ids)
                )
            )

        AppSettingPublisher.selected_global_relationships_deleted(uids)

        return True
