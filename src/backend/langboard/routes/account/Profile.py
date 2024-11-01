from ...core.routing import BaseFormModel, form_model


@form_model
class UpdateProfileForm(BaseFormModel):
    firstname: str
    lastname: str
    affiliation: str | None = None
    position: str | None = None
    delete_avatar: bool = False
