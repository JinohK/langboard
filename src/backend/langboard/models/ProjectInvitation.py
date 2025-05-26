from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from sqlmodel import Field
from ..Constants import COMMON_SECRET_KEY
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from ..core.utils.Encryptor import Encryptor
from .Project import Project


class ProjectInvitation(BaseSqlModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project, nullable=False, index=True)
    email: str = Field(nullable=False)
    token: str = Field(nullable=False)

    @staticmethod
    def validate_token(token: str) -> tuple[str, SnowflakeID] | None:
        try:
            token_info = json_loads(Encryptor.decrypt(token, COMMON_SECRET_KEY))
            if not token_info or "token" not in token_info or "uid" not in token_info:
                return None
            invitation_token = token_info["token"]
            invitation_id = SnowflakeID.from_short_code(token_info["uid"])
        except Exception:
            return None
        return invitation_token, invitation_id

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

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
