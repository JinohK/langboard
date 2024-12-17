from ....core.routing import BaseFormModel, form_model


@form_model
class CreateCardCheckitemForm(BaseFormModel):
    title: str
    assigned_users: list[int] | None = None


@form_model
class CardifyCheckitemForm(BaseFormModel):
    column_uid: str | None = None
    with_sub_checkitems: bool = False
    with_assign_users: bool = False
