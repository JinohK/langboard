from typing import Any
from bcrypt import checkpw, gensalt, hashpw
from sqlmodel import Field
from ..core.db import ModelColumnType, SecretStr, SecretStrType, SoftDeleteModel
from ..core.storage import FileModel


class User(SoftDeleteModel, table=True):
    name: str = Field(nullable=False)
    email: str = Field(nullable=False)
    password: SecretStr = Field(nullable=False, sa_type=SecretStrType)
    industry: str = Field(nullable=False)
    purpose: str = Field(nullable=False)
    affiliation: str | None = Field(default=None, nullable=True)
    position: str | None = Field(default=None, nullable=True)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))

    def check_password(self, password: str) -> bool:
        return checkpw(password.encode(), self.password.get_secret_value().encode())

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name", "email", "industry", "purpose", "affiliation", "position"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "password" and not isinstance(value, SecretStr):
            value = SecretStr(hashpw(value.encode(), gensalt()).decode())
        super().__setattr__(name, value)
