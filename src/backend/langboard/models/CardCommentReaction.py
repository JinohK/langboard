from typing import Any
from sqlmodel import Field
from .BaseReactionModel import BaseReactionModel
from .CardComment import CardComment


class CardCommentReaction(BaseReactionModel, table=True):
    comment_uid: int = Field(foreign_key=CardComment.expr("uid"), nullable=False)

    @staticmethod
    def get_target_column_name() -> str:
        return "comment_uid"

    def api_response(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
