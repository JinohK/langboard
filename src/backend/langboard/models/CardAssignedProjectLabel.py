from typing import Any
from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField
from .Card import Card
from .ProjectLabel import ProjectLabel


class CardAssignedProjectLabel(BaseSqlModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False)
    project_label_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectLabel.expr("id"), nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "project_label_id"]
