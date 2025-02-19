from pydantic import Field
from ....core.routing import BaseFormModel, form_model


@form_model
class CreateProjectLabelForm(BaseFormModel):
    name: str = Field(..., description="Project label name")
    color: str = Field(..., description="Project label color in hex format")
    description: str = Field(..., description="Project label description")


@form_model
class UpdateProjectLabelDetailsForm(BaseFormModel):
    name: str | None = Field(default=None, description="Project label name")
    color: str | None = Field(default=None, description="Project label color in hex format")
    description: str | None = Field(default=None, description="Project label description")
