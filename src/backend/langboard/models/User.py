from typing import Any
from sqlmodel import Field
from bcrypt import hashpw, gensalt, checkpw
from ..core.db import SoftDeleteModel, SecretStr, SecretStrType


class User(SoftDeleteModel, table=True):
    name: str = Field(nullable=False)
    email: str = Field(nullable=False)
    password: SecretStr = Field(nullable=False, sa_type=SecretStrType())
    industry: str = Field(nullable=False)
    purpose: str = Field(nullable=False)
    affiliation: str | None = Field(nullable=True)
    position: str | None = Field(nullable=True)

    def check_password(self, password: str) -> bool:
        return checkpw(password.encode(), self.password.get_secret_value().encode())

    def _get_repr_keys(self) -> list[str]:
        return ["name", "email", "industry", "purpose", "affiliation", "position"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "password":
            value = SecretStr(hashpw(value.encode(), gensalt()).decode())
        super().__setattr__(name, value)
