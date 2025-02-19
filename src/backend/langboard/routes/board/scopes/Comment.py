from pydantic import Field
from ....core.routing import BaseFormModel, form_model
from ....models.BaseReactionModel import REACTION_TYPES


@form_model
class ToggleCardCommentReactionForm(BaseFormModel):
    reaction: str = Field(..., description=f"Reaction type: {', '.join(REACTION_TYPES)}")
