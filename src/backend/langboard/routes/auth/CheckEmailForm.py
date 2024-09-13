from pydantic import BaseModel, field_validator


class CheckEmailForm(BaseModel):
    is_token: bool
    login_token: str
    token: str = None
    email: str = None

    @field_validator("is_token", mode="after")
    @classmethod
    def check_is_token_or_email(cls, value):
        print(isinstance(cls, CheckEmailForm))
        if value:
            if not cls.token:
                raise ValueError("token is required")
        else:
            if not cls.email:
                raise ValueError("email is required")
        return value
