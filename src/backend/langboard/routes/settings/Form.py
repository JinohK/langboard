from typing import Any
from ...core.routing import BaseFormModel, form_model
from ...core.setting import AppSettingType


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


@form_model
class UpdateBotForm(BaseFormModel):
    bot_name: str | None = None
    bot_uname: str | None = None
    delete_avatar: bool = False
