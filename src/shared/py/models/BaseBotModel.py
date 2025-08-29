from enum import Enum
from typing import Any, ClassVar
from core.db import EnumLikeType, SoftDeleteModel
from sqlmodel import Field


class BotPlatform(Enum):
    Default = "default"
    Langflow = "langflow"


class BotPlatformRunningType(Enum):
    Default = "default"
    Endpoint = "endpoint"
    FlowJson = "flow_json"


class BaseBotModel(SoftDeleteModel):
    AVAILABLE_RUNNING_TYPES_BY_PLATFORM: ClassVar[dict[BotPlatform, list[BotPlatformRunningType]]] = {
        BotPlatform.Default: [BotPlatformRunningType.Default],
        BotPlatform.Langflow: [BotPlatformRunningType.Endpoint, BotPlatformRunningType.FlowJson],
    }
    platform: BotPlatform = Field(nullable=False, sa_type=EnumLikeType(BotPlatform))
    platform_running_type: BotPlatformRunningType = Field(nullable=False, sa_type=EnumLikeType(BotPlatformRunningType))

    def notification_data(self) -> dict[str, Any]:
        return self.api_response()
