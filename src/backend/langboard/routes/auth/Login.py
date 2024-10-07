from pydantic import BaseModel
from ...core.routing import BaseFormModel, form_model


@form_model
class LoginForm(BaseFormModel):
    login_token: str
    email_token: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
