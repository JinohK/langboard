from typing import Optional, Self
from pydantic import BaseModel, model_validator
from ....core.routing import BaseFormModel, form_model
from ....core.routing.Exception import MissingException


@form_model
class AuthEmailForm(BaseFormModel):
    is_token: bool
    sign_token: str
    token: Optional[str] = None
    email: Optional[str] = None

    @model_validator(mode="after")
    def check_is_token_or_email(self) -> Self:
        if self.is_token:
            loc = None if self.token else "token"
        else:
            loc = None if self.email else "email"

        if loc:
            raise MissingException(loc)

        return self


class AuthEmailResponse(BaseModel):
    token: str
    email: str
