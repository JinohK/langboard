from ....core.routing import BaseFormModel, form_model


@form_model
class CreateProjectLabelForm(BaseFormModel):
    name: str
    color: str
    description: str


@form_model
class UpdateProjectLabelDetailsForm(BaseFormModel):
    name: str | None = None
    color: str | None = None
    description: str | None = None
