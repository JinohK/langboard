from ...core.routing import BaseFormModel, form_model


@form_model
class UpdateProfileForm(BaseFormModel):
    firstname: str
    lastname: str
    affiliation: str | None = None
    position: str | None = None
    delete_avatar: bool = False


@form_model
class AddNewEmailForm(BaseFormModel):
    new_email: str
    url: str
    verify_token_query_name: str
    lang: str = "en-US"
    is_resend: bool = False


@form_model
class VerifyNewEmailForm(BaseFormModel):
    verify_token: str


@form_model
class EmailForm(BaseFormModel):
    email: str


@form_model
class ChangePasswordForm(BaseFormModel):
    current_password: str
    new_password: str
