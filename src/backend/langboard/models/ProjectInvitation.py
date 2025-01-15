from json import dumps as json_dumps
from typing import Any
from sqlmodel import Field
from ..Constants import COMMON_SECRET_KEY
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from ..core.utils.Encryptor import Encryptor
from .Project import Project


class ProjectInvitation(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    email: str = Field(nullable=False)
    token: str = Field(nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "encrypted_token": self.create_encrypted_token(),
        }

    def create_encrypted_token(self) -> str:
        token_data = json_dumps({"token": self.token, "uid": self.get_uid()})
        encrypted_token = Encryptor.encrypt(token_data, COMMON_SECRET_KEY)
        return encrypted_token

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
