from ...core.routing import BaseFormModel, form_model


@form_model
class DashboardProjectCreateForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"
