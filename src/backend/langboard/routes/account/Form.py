from ...core.routing import BaseFormModel, form_model


@form_model
class UpdateProfileForm(BaseFormModel):
    firstname: str
    lastname: str
    affiliation: str | None = None
    position: str | None = None
    delete_avatar: bool = False


@form_model
class ChangePasswordForm(BaseFormModel):
    current_password: str
    new_password: str
