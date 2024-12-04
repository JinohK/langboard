from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .User import User


class UserGroup(BaseSqlModel, table=True):
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    name: str = Field(nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]
