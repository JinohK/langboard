from ....core.routing import BaseFormModel, form_model


@form_model
class CheckEmailForm(BaseFormModel):
    email: str


@form_model
class SignUpForm(BaseFormModel):
    firstname: str
    lastname: str
    email: str
    password: str
    industry: str
    purpose: str
    affiliation: str | None = None
    position: str | None = None
    url: str
    activate_token_query_name: str
    lang: str = "en-US"


@form_model
class ResendLinkForm(BaseFormModel):
    email: str
    url: str
    activate_token_query_name: str
    lang: str = "en-US"


@form_model
class ActivateUserForm(BaseFormModel):
    signup_token: str
