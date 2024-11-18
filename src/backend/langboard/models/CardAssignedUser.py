from sqlmodel import Field
from ..core.db import BaseSqlModel
from .Card import Card
from .User import User


class CardAssignedUser(BaseSqlModel, table=True):
    card_id: int = Field(foreign_key=Card.expr("id"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_id", "user_id"]
