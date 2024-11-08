from sqlalchemy import JSON
from sqlmodel import Field
from ..core.db import BaseSqlModel
from ..models import User


class UserNotification(BaseSqlModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    message_lang: str = Field(nullable=False)
    message_vars: dict[str, str] = Field(default={}, sa_type=JSON)
    link: str | None = Field(default=None, nullable=True)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "message_lang", "message_vars", "link"]
