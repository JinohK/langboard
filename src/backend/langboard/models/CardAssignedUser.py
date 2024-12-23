from ..core.db import BaseSqlModel, SnowflakeID, SnowflakeIDField, User
from .Card import Card


class CardAssignedUser(BaseSqlModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card.expr("id"), nullable=False, index=True)
    user_id: SnowflakeID = SnowflakeIDField(foreign_key=User.expr("id"), nullable=False, index=True)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "user_id"]
