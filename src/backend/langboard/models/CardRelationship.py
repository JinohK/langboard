from typing import Any
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Card import Card
from .GlobalCardRelationshipType import GlobalCardRelationshipType


class CardRelationship(BaseSqlModel, table=True):
    relation_type_id: SnowflakeID = SnowflakeIDField(
        foreign_key=GlobalCardRelationshipType.expr("id"), nullable=False, index=True
    )
    card_id_parent: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)
    card_id_child: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["relation_type_id", "card_id_parent", "card_id_child"]
