from sqlmodel import Field
from .BaseActivityModel import BaseActivityModel
from .Card import Card


class CardActivity(BaseActivityModel, table=True):
    card_id: int = Field(foreign_key=Card.expr("id"), nullable=False)
