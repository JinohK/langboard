from ....core.routing import BaseFormModel, form_model


@form_model
class CreateCardForm(BaseFormModel):
    title: str
    column_uid: str


@form_model
class ChangeCardDetailsForm(BaseFormModel):
    title: str | None = None
    deadline_at: str | None = None
    description: dict | None = None


@form_model
class UpdateCardLabelsForm(BaseFormModel):
    labels: list[str]
