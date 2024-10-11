from ....core.routing import BaseFormModel, form_model


@form_model
class SignUpForm(BaseFormModel):
    name: str
    email: str
    password: str
    industry: str
    purpose: str
    affiliation: str | None = None
    position: str | None = None
