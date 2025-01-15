from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Card import Card


class CheckGroup(SoftDeleteModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)
    title: str = Field(nullable=False)
    order: int = Field(default=0, nullable=False)
    is_checked: bool = Field(default=False, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "card_uid": self.card_id.to_short_code(),
            "title": self.title,
            "order": self.order,
            "is_checked": self.is_checked,
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "title", "order", "is_checked"]
