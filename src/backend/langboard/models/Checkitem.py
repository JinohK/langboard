from typing import Any
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .Card import Card


class Checkitem(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    card_uid: str = Field(foreign_key=Card.expr("uid"), nullable=False)
    checkitem_uid: str | None = Field(default=None, foreign_key="checkitem.uid", nullable=True)
    cardified_uid: str | None = Field(default=None, foreign_key=Card.expr("uid"), nullable=True)
    title: str = Field(nullable=False)
    order: int = Field(default=0, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "title": self.title,
            "checkitem_uid": self.checkitem_uid,
            "cardified_uid": self.cardified_uid,
            "order": self.order,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "card_uid", "checkitem_uid", "cardified_uid", "title", "order"]
