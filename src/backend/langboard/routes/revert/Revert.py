from ...core.routing import BaseFormModel, form_model


@form_model
class RevertForm(BaseFormModel):
    revert_key: str
