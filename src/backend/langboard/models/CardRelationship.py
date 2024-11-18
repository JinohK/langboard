from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel
from .Card import Card
from .GlobalCardRelationshipType import GlobalCardRelationshipType


class CardRelationship(BaseSqlModel, table=True):
    relation_type_id: int = Field(foreign_key=GlobalCardRelationshipType.expr("id"), nullable=False)
    card_uid_parent: str = Field(foreign_key=Card.expr("uid"), nullable=False, index=True)
    card_uid_child: str = Field(foreign_key=Card.expr("uid"), nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["relation_type_id", "card_uid_parent", "card_uid_child"]
