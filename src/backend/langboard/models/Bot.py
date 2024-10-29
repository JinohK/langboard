from enum import Enum
from sqlmodel import Field
from ..core.db import SoftDeleteModel


class BotType(Enum):
    ProjectChat = "project_chat"


class Bot(SoftDeleteModel, table=True):
    bot_type: BotType = Field(nullable=False, unique=True)
    name: str = Field(nullable=False)
    flow_id: str = Field(nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_type", "name", "flow_id"]
