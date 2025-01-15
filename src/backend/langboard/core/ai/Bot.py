from typing import Any, ClassVar
from sqlmodel import Field
from ..db import ModelColumnType, SoftDeleteModel, User
from ..storage import FileModel


class Bot(SoftDeleteModel, table=True):
    BOT_UNAME_PREFIX: ClassVar[str] = "bot-"
    name: str = Field(nullable=False)
    bot_uname: str = Field(nullable=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))

    def api_response(self) -> dict[str, Any]:
        if self.deleted_at is not None:
            return self.create_unknown_bot_api_response()

        return {
            "uid": self.get_uid(),
            "name": self.name,
            "bot_uname": self.bot_uname,
            "avatar": self.avatar.path if self.avatar else None,
            "as_user": self.as_user_api_response(),
        }

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
            "as_user": {
                "type": User.UNKNOWN_USER_TYPE,
                "uid": self.get_uid(),
                "firstname": "",
                "lastname": "",
                "email": "",
                "username": "",
                "avatar": None,
            },
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "bot_uname" and isinstance(value, str):
            value = value if value.startswith(self.BOT_UNAME_PREFIX) else f"{self.BOT_UNAME_PREFIX}{value}"
        super().__setattr__(name, value)
