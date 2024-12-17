from ....core.routing import BaseFormModel, form_model


@form_model
class ColumnForm(BaseFormModel):
    name: str
