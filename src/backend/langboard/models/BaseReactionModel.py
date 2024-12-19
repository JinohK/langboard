from abc import abstractmethod
from typing import Any
from sqlmodel import Field
from ..core.ai import BotType
from ..core.db import BaseSqlModel
from .User import User


class BaseReactionModel(BaseSqlModel):
    user_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    bot_type: BotType | None = Field(default=None, nullable=True)
    reaction_type: str = Field(nullable=False)

    @staticmethod
    @abstractmethod
    def get_target_column_name() -> str: ...

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
