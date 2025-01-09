from datetime import datetime
from typing import Any, ClassVar
from bcrypt import checkpw, gensalt, hashpw
from sqlmodel import Field
from ..storage import FileModel
from ..utils.String import generate_random_string
from .ColumnTypes import DateTimeField, ModelColumnType, SecretStr, SecretStrType
from .Models import SoftDeleteModel
from .SnowflakeID import SnowflakeID


class User(SoftDeleteModel, table=True):
    USER_TYPE: ClassVar[str] = "user"
    UNKNOWN_USER_TYPE: ClassVar[str] = "unknown"
    BOT_TYPE: ClassVar[str] = "bot"
    GROUP_EMAIL_TYPE: ClassVar[str] = "group_email"
    firstname: str = Field(nullable=False)
    lastname: str = Field(nullable=False)
    email: str = Field(nullable=False)
    username: str = Field(default=f"user-{generate_random_string(8)}", unique=True, nullable=False)
    password: SecretStr = Field(nullable=False, sa_type=SecretStrType)
    industry: str = Field(nullable=False)
    purpose: str = Field(nullable=False)
    affiliation: str | None = Field(default=None, nullable=True)
    position: str | None = Field(default=None, nullable=True)
    is_admin: bool = Field(default=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))
    activated_at: datetime | None = DateTimeField(default=None, nullable=True)

    def check_password(self, password: str) -> bool:
        return checkpw(password.encode(), self.password.get_secret_value().encode())

    def set_password(self, password: str) -> None:
        self.password = self.__create_password(password)

    def get_fullname(self) -> str:
        return f"{self.firstname} {self.lastname}"

    def api_response(self) -> dict[str, Any]:
        if self.deleted_at is not None:
            return self.create_unknown_user_api_response()

        return {
            "type": User.USER_TYPE,
            "uid": self.get_uid(),
            "firstname": self.firstname,
            "lastname": self.lastname,
            "email": self.email,
            "username": self.username,
            "avatar": self.avatar.path if self.avatar else None,
        }

    def create_unknown_user_api_response(self) -> dict[str, Any]:
        return {
            "type": User.UNKNOWN_USER_TYPE,
            "uid": self.get_uid(),
            "firstname": "",
            "lastname": "",
            "email": "",
            "username": "",
            "avatar": None,
        }

    @staticmethod
    def create_email_user_api_response(user_id: SnowflakeID, email: str) -> dict[str, Any]:
        return {
            "type": User.GROUP_EMAIL_TYPE,
            "uid": user_id.to_short_code(),
            "firstname": email,
            "lastname": "",
            "email": email,
            "username": "",
            "avatar": None,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return [
            "firstname",
            "lastname",
            "email",
            "industry",
            "purpose",
            "affiliation",
            "position",
            "is_admin",
            "activated_at",
        ]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "password" and not isinstance(value, SecretStr):
            value = self.__create_password(value)
        super().__setattr__(name, value)

    def __create_password(self, password: str) -> SecretStr:
        return SecretStr(hashpw(password.encode(), gensalt()).decode())
