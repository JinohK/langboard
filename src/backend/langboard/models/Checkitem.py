from typing import Any
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Card import Card


class Checkitem(SoftDeleteModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)
    checkitem_id: SnowflakeID | None = SnowflakeIDField(foreign_key="checkitem.id", nullable=True)
    cardified_id: SnowflakeID | None = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=True)
    title: str = Field(nullable=False)
    order: int = Field(default=0, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
            "checkitem_uid": self.checkitem_id.to_short_code() if self.checkitem_id else None,
            "cardified_uid": self.cardified_id.to_short_code() if self.cardified_id else None,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "checkitem_id", "cardified_id", "title", "order"]
