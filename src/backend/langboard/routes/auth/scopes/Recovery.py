from ....core.routing import BaseFormModel, form_model


@form_model
class SendResetLinkForm(BaseFormModel):
    sign_token: str
    email_token: str
    url: str
    recovery_token_query_name: str
    firstname: str = ""
    lastname: str = ""
    is_resend: bool = False
    lang: str = "en-US"


@form_model
class ValidateTokenForm(BaseFormModel):
    recovery_token: str


@form_model
class ResetPasswordForm(BaseFormModel):
    recovery_token: str
    password: str
