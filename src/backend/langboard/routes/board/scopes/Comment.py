from ....core.routing import BaseFormModel, form_model


@form_model
class ToggleCardCommentReactionForm(BaseFormModel):
    reaction: str
