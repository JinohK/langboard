from datetime import datetime
from typing import Any
from bcrypt import checkpw, gensalt, hashpw
from sqlmodel import Field
from ..core.db import DateTimeField, ModelColumnType, SecretStr, SecretStrType, SoftDeleteModel
from ..core.storage import FileModel
from ..core.utils.String import generate_random_string


class User(SoftDeleteModel, table=True):
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
            return {
                "id": 0,
                "firstname": "",
                "lastname": "",
                "email": "",
                "username": "",
                "avatar": None,
            }

        return {
            "id": self.id,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "email": self.email,
            "username": self.username,
            "avatar": self.avatar.path if self.avatar else None,
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
