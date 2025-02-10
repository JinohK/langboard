from datetime import datetime
from enum import Enum
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from sqlalchemy import Text
from sqlmodel import Field
from ..db import BaseSqlModel, DateTimeField, EnumLikeType


class AppSettingType(Enum):
    ApiKey = "api_key"
    LangflowUrl = "langflow_url"
    LangflowApiKey = "langflow_api_key"
    WebhookUrl = "webhook_url"


class AppSetting(BaseSqlModel, table=True):
    setting_type: AppSettingType = Field(nullable=False, sa_type=EnumLikeType(AppSettingType))
    setting_name: str = Field(nullable=False)
    setting_value: str = Field(default="", sa_type=Text)
    last_used_at: datetime | None = DateTimeField(default=None, nullable=True)
    total_used_count: int = Field(default=0, nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "setting_type": f"Literal[{', '.join([setting_type.value for setting_type in AppSettingType])}]",
            "setting_name": "string",
            "setting_value": "string",
            "created_at": "string",
            "last_used_at": "string?",
            "total_used_count": "integer",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "setting_type": self.setting_type.value,
            "setting_name": self.setting_name,
            "setting_value": self.convert_to_secret(),
            "created_at": self.created_at,
            "last_used_at": self.last_used_at,
            "total_used_count": self.total_used_count,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def is_immutable_type(self) -> bool:
        return self.setting_type in [AppSettingType.ApiKey]

    def is_secret_type(self) -> bool:
        return self.setting_type in [AppSettingType.ApiKey]

    def convert_to_secret(self) -> Any:
        value = self.get_value()
        if self.is_secret_type():
            if self.setting_type == AppSettingType.ApiKey:
                hide_rest_value = "*" * (len(value) - 8)
                return f"{value[:8]}{hide_rest_value}"
        return value

    def get_value(self) -> Any:
        return json_loads(self.setting_value)

    def set_value(self, value: Any):
        self.setting_value = json_dumps(value, default=str)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
