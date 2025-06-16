from typing import Any
from ..core.db import BaseSqlModel, SnowflakeIDField
from ..core.types import SnowflakeID
from .Card import Card
from .GlobalCardRelationshipType import GlobalCardRelationshipType


class CardRelationship(BaseSqlModel, table=True):
    relationship_type_id: SnowflakeID = SnowflakeIDField(
        foreign_key=GlobalCardRelationshipType, nullable=False, index=True
    )
    card_id_parent: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)
    card_id_child: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "relationship_type_uid": "string",
            "parent_card_uid": "string",
            "child_card_uid": "string",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "relationship_type_uid": self.relationship_type_id.to_short_code(),
            "parent_card_uid": self.card_id_parent.to_short_code(),
            "child_card_uid": self.card_id_child.to_short_code(),
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["relationship_type_id", "card_id_parent", "card_id_child"]
