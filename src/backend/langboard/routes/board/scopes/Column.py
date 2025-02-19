from pydantic import Field
from ....core.routing import BaseFormModel, form_model


@form_model
class ColumnForm(BaseFormModel):
    name: str = Field(..., description="Project column name")
