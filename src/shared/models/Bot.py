from enum import Enum
from typing import Any, ClassVar
from core.db import CSVType, EnumLikeType, ModelColumnType, SoftDeleteModel
from core.storage import FileModel
from sqlalchemy import TEXT
from sqlmodel import Field
from .User import User


class BotAPIAuthType(Enum):
    Langflow = "langflow"


class Bot(SoftDeleteModel, table=True):
    BOT_UNAME_PREFIX: ClassVar[str] = "bot-"
    name: str = Field(nullable=False)
    bot_uname: str = Field(nullable=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))
    api_url: str = Field(nullable=False)
    api_auth_type: BotAPIAuthType = Field(nullable=False, sa_type=EnumLikeType(BotAPIAuthType))
    api_key: str = Field(nullable=False)
    app_api_token: str = Field(nullable=False)
    ip_whitelist: list[str] = Field(default=[], sa_type=CSVType)
    prompt: str = Field(default="", sa_type=TEXT)

    @staticmethod
    def api_schema(is_setting: bool = False, other_schema: dict | None = None) -> dict[str, Any]:
        schema = {
            "uid": "string",
            "name": "string",
            "bot_uname": "string",
            "avatar": "string?",
            "as_user": User.api_schema(),
            **(other_schema or {}),
        }
        if is_setting:
            schema.update(
                {
                    "api_url": "string",
                    "api_auth_type": f"Literal[{', '.join([auth_type.value for auth_type in BotAPIAuthType])}]",
                    "api_key": "string",
                    "app_api_token": "string",
                    "ip_whitelist": "List[string]",
                    "prompt": "string",
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
            "as_user": self.as_user_api_response(),
        }
        if is_setting:
            response["api_url"] = self.api_url
            response["api_auth_type"] = self.api_auth_type.value
            response["api_key"] = self.api_key
            hide_rest_value = "*" * (len(self.app_api_token) - 8)
            response["app_api_token"] = f"{self.app_api_token[:8]}{hide_rest_value}"
            response["ip_whitelist"] = self.ip_whitelist
            response["prompt"] = self.prompt

        return response

    def as_user_api_response(self) -> dict[str, Any]:
        return {
            "type": User.BOT_TYPE,
            "uid": self.get_uid(),
            "firstname": self.name,
            "lastname": "",
            "email": "",
            "username": self.bot_uname,
            "avatar": self.avatar.path if self.avatar else None,
        }

    def create_unknown_bot_api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "bot_uname": self.bot_uname,
            "avatar": None,
            "as_user": Bot.create_unknown_as_user_api_response(self.get_uid()),
        }

    @staticmethod
    def create_unknown_as_user_api_response(uid: str) -> dict[str, Any]:
        return {
            "type": User.UNKNOWN_USER_TYPE,
            "uid": uid,
            "firstname": "",
            "lastname": "",
            "email": "",
            "username": "",
            "avatar": None,
        }

    def notification_data(self) -> dict[str, Any]:
        return self.as_user_api_response()

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "bot_uname" and isinstance(value, str):
            value = value if value.startswith(self.BOT_UNAME_PREFIX) else f"{self.BOT_UNAME_PREFIX}{value}"
        super().__setattr__(name, value)
