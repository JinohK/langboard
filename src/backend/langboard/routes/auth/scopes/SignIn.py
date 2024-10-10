from pydantic import BaseModel
from ....core.routing import BaseFormModel, form_model


@form_model
class SignInForm(BaseFormModel):
    sign_token: str
    email_token: str
    password: str


class SignInResponse(BaseModel):
    access_token: str
    refresh_token: str
