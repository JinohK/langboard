from datetime import datetime
from sqlmodel import Field
from ..core.db import DateTimeField, SoftDeleteModel
from .User import User


class UserEmail(SoftDeleteModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    email: str = Field(nullable=False)
    verified_at: datetime | None = DateTimeField(default=None, nullable=True)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "email", "verified_at"]
