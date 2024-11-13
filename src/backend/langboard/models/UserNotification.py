from sqlalchemy import JSON
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..models import User


class UserNotification(SoftDeleteModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    message_lang_key: str = Field(nullable=False)
    message_vars: dict[str, str] = Field(default={}, sa_type=JSON)
    link: str | None = Field(default=None, nullable=True)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "message_lang_key", "message_vars", "link"]
