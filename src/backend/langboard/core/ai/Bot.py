from typing import Any
from sqlmodel import Field
from ..db import BaseSqlModel, ModelColumnType, User
from ..storage import FileModel
from .BotType import BotType


class Bot(BaseSqlModel, table=True):
    bot_type: BotType = Field(nullable=False, unique=True)
    display_name: str = Field(nullable=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))

    def api_response(self) -> dict[str, Any]:
        return {
            "bot_type": self.bot_type,
            "display_name": self.display_name,
            "avatar": self.avatar.path if self.avatar else None,
        }

    def api_response_as_user(self) -> dict[str, Any]:
        return {
            "uid": User.BOT_UID,
            "firstname": self.display_name,
            "lastname": "",
            "email": "",
            "username": "",
            "avatar": self.avatar.path if self.avatar else None,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_type", "avatar"]
