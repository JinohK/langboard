from typing import Any
from ..core.db import SnowflakeIDField
from ..core.types import SnowflakeID
from .BaseMetadataModel import BaseMetadataModel
from .Card import Card


class CardMetadata(BaseMetadataModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return BaseMetadataModel.api_schema({"card_uid": "string"})

    def api_response(self) -> dict[str, Any]:
        return {
            "card_uid": self.card_id.to_short_code(),
            **(super().api_response()),
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "key"]
