from enum import Enum
from typing import Any
from core.db import EnumLikeType, ModelColumnType
from core.storage import FileModel
from sqlalchemy import Text
from sqlmodel import Field
from .BaseBotModel import BaseBotModel, BotPlatform, BotPlatformRunningType


class InternalBotType(Enum):
    ProjectChat = "project_chat"
    EditorChat = "editor_chat"
    EditorCopilot = "editor_copilot"


class InternalBot(BaseBotModel, table=True):
    bot_type: InternalBotType = Field(nullable=False, sa_type=EnumLikeType(InternalBotType))
    display_name: str = Field(nullable=False)
    url: str = Field(default="", nullable=False)
    api_key: str = Field(default="", nullable=False)
    value: str = Field(default="", nullable=False, sa_type=Text)
    is_default: bool = Field(default=False, nullable=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))

    @staticmethod
    def api_schema(schema: dict | None = None, is_setting: bool = False) -> dict[str, Any]:
        schema = {
            "uid": "string",
            "bot_type": f"Literal[{', '.join([bot_type.value for bot_type in InternalBotType])}]",
            "display_name": "string",
            "avatar": "string?",
            **(schema or {}),
        }

        if is_setting:
            schema.update(
                {
                    "platform": f"Literal[{', '.join([platform.value for platform in BotPlatform])}]",
                    "platform_running_type": f"Literal[{', '.join([running_type.value for running_type in BotPlatformRunningType])}]",
                    "url": "string",
                    "api_key": "string",
                    "is_default": "bool",
                    "value": "string",
                }
            )

        return schema

    def api_response(self, is_setting: bool = False) -> dict[str, Any]:
        setting = {
            "uid": self.get_uid(),
            "bot_type": self.bot_type.value,
            "display_name": self.display_name,
            "avatar": self.avatar.path if self.avatar else None,
        }

        if is_setting:
            setting.update(
                {
                    "platform": self.platform.value,
                    "platform_running_type": self.platform_running_type.value,
                    "url": self.url,
                    "api_key": self.api_key,
                    "is_default": self.is_default,
                    "value": self.value,
                }
            )

        return setting

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_type", "display_name", "platform", "platform_running_type", "is_default"]
