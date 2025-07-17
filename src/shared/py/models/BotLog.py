from enum import Enum
from typing import Any
from core.db import BaseSqlModel, EnumLikeType, ModelColumnListType, SnowflakeIDField
from core.types import SafeDateTime, SnowflakeID
from pydantic import BaseModel
from sqlmodel import Field
from .Bot import Bot


class BotLogType(Enum):
    Info = "info"
    Success = "success"
    Error = "error"


class BotLogMessage(BaseModel):
    message: str
    log_type: BotLogType
    log_date: SafeDateTime = Field(default_factory=SafeDateTime.now, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {"message": "string", "log_type": "string", "log_date": "string"}


class BotLog(BaseSqlModel, table=True):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, index=True)
    log_type: BotLogType = Field(default=BotLogType.Info, nullable=False, sa_type=EnumLikeType(BotLogType))
    message_stack: list[BotLogMessage] = Field(default=[], nullable=False, sa_type=ModelColumnListType(BotLogMessage))

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "bot_uid": "string",
            "log_type": "string",
            "message_stack": f"List[{BotLogMessage.api_schema()}]",
            "updated_at": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "bot_uid": self.bot_id.to_short_code(),
            "log_type": self.log_type.value,
            "message_stack": [stack.model_dump() for stack in self.message_stack],
            "updated_at": self.updated_at,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "log_type"]
