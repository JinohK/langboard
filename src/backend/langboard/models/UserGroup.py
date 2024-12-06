from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .User import User


class UserGroup(BaseSqlModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    name: str = Field(nullable=False)
    order: int = Field(nullable=False, default=0)

    def api_response(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name", "order"]
