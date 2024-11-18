from sqlalchemy import TEXT
from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .Card import Card
from .User import User


class CardComment(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    card_uid: str = Field(foreign_key=Card.expr("uid"), nullable=False)
    user_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    content: str | None = Field(default=None, sa_type=TEXT, nullable=True)

    def api_response(self):
        return {
            "uid": self.uid,
            "content": self.content,
            "is_edited": self.created_at.timestamp() != self.updated_at.timestamp(),
            "commented_at": self.updated_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["card_uid", "user_id"]
