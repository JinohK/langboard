from sqlmodel import Field
from ..core.ai import BotType
from ..core.db import EditorContentModel, ModelColumnType, SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .Card import Card
from .User import User


class CardComment(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    card_uid: str = Field(foreign_key=Card.expr("uid"), nullable=False)
    user_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    bot_type: BotType | None = Field(default=None, nullable=True)
    content: EditorContentModel | None = Field(default=None, sa_type=ModelColumnType(EditorContentModel))

    def api_response(self):
        return {
            "uid": self.uid,
            "content": self.content.model_dump() if self.content else None,
            "is_edited": self.created_at.timestamp() != self.updated_at.timestamp(),
            "commented_at": self.updated_at,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "card_uid", "user_id", "bot_type"]
