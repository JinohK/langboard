from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .User import User


class ChatHistory(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(16), unique=True, nullable=False)
    filterable: str | None = Field(default=None, nullable=True)
    sender_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    receiver_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    history_type: str = Field(nullable=False)
    message: str = Field(nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "filterable", "sender_id", "receiver_id", "history_type", "message"]
