from typing import Any, ClassVar
from core.db import CSVType, ModelColumnType
from core.storage import FileModel
from sqlalchemy import TEXT
from sqlmodel import Field
from .BaseBotModel import BaseBotModel, BotPlatform, BotPlatformRunningType


ALLOWED_ALL_IPS = "*"


class Bot(BaseBotModel, table=True):
    BOT_TYPE: ClassVar[str] = "bot"
    BOT_UNAME_PREFIX: ClassVar[str] = "bot-"
    name: str = Field(nullable=False)
    bot_uname: str = Field(nullable=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))
    api_url: str = Field(default="", nullable=False)
    api_key: str = Field(default="", nullable=False)
    app_api_token: str = Field(nullable=False)
    ip_whitelist: list[str] = Field(default=[], sa_type=CSVType)
    value: str = Field(default="", sa_type=TEXT)

    @staticmethod
    def api_schema(is_setting: bool = False, other_schema: dict | None = None) -> dict[str, Any]:
        schema = {
            "uid": "string",
            "name": "string",
            "bot_uname": "string",
            "avatar": "string?",
            **(other_schema or {}),
        }
        if is_setting:
            schema.update(
                {
                    "platform": f"Literal[{', '.join([platform.value for platform in BotPlatform])}]",
                    "platform_running_type": f"Literal[{', '.join([running_type.value for running_type in BotPlatformRunningType])}]",
                    "api_url": "string",
                    "api_key": "string",
                    "app_api_token": "string",
                    "ip_whitelist": "List[string]",
                    "value": "string",
                }
            )

        return schema

    def get_fullname(self) -> str:
        return f"{self.name}"

    def api_response(self, is_setting: bool = False) -> dict[str, Any]:
        if self.deleted_at is not None:
            return self.create_unknown_bot_api_response()

        response = {
            "uid": self.get_uid(),
            "name": self.name,
            "bot_uname": self.bot_uname,
            "avatar": self.avatar.path if self.avatar else None,
        }
        if is_setting:
            response["platform"] = self.platform.value
            response["platform_running_type"] = self.platform_running_type.value
            response["api_url"] = self.api_url
            response["api_key"] = self.api_key
            hide_rest_value = "*" * (len(self.app_api_token) - 8)
            response["app_api_token"] = f"{self.app_api_token[:8]}{hide_rest_value}"
            response["ip_whitelist"] = self.ip_whitelist
            response["value"] = self.value

        return response

    def create_unknown_bot_api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "bot_uname": self.bot_uname,
            "avatar": None,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "bot_uname" and isinstance(value, str):
            value = value if value.startswith(self.BOT_UNAME_PREFIX) else f"{self.BOT_UNAME_PREFIX}{value}"
        super().__setattr__(name, value)
