from typing import Any
from pydantic import Field
from ...core.routing import BaseFormModel, form_model
from ...models.AppSetting import AppSettingType
from ...models.Bot import BotAPIAuthType
from ...models.BotTrigger import BotTriggerCondition


@form_model
class CreateSettingForm(BaseFormModel):
    setting_type: AppSettingType
    setting_name: str
    setting_value: Any = ""


@form_model
class UpdateSettingForm(BaseFormModel):
    setting_name: str | None = None
    setting_value: Any | None = None


@form_model
class DeleteSelectedSettingsForm(BaseFormModel):
    setting_uids: list[str]


@form_model
class CreateBotForm(BaseFormModel):
    bot_name: str
    bot_uname: str
    api_url: str
    api_auth_type: BotAPIAuthType
    api_key: str
    ip_whitelist: str | None = None
    prompt: str | None = None


@form_model
class UpdateBotForm(BaseFormModel):
    bot_name: str | None = None
    bot_uname: str | None = None
    api_url: str | None = None
    api_auth_type: BotAPIAuthType | None = None
    api_key: str | None = None
    ip_whitelist: str | None = None
    prompt: str | None = None
    delete_avatar: bool = False


@form_model
class PredefineBotTriggerConditionForm(BaseFormModel):
    conditions: list[BotTriggerCondition] = Field(..., description="List of bot trigger conditions")


@form_model
class ToggleBotTriggerConditionForm(BaseFormModel):
    condition: BotTriggerCondition


@form_model
class CreateGlobalRelationshipTypeForm(BaseFormModel):
    parent_name: str
    child_name: str
    description: str = ""


@form_model
class UpdateGlobalRelationshipTypeForm(BaseFormModel):
    parent_name: str | None = None
    child_name: str | None = None
    description: str | None = None


@form_model
class DeleteSelectedGlobalRelationshipTypesForm(BaseFormModel):
    relationship_type_uids: list[str]
