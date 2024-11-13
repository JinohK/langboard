from datetime import datetime
from typing import Any
from sqlmodel import Field
from ..core.db import DateTimeField, SoftDeleteModel
from .User import User


class UserEmail(SoftDeleteModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    email: str = Field(nullable=False)
    verified_at: datetime | None = DateTimeField(default=None, nullable=True)

    def api_response(self) -> dict[str, Any]:
        return {
            "email": self.email,
            "verified_at": self.verified_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "email", "verified_at"]
