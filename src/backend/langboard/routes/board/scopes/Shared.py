from ....core.routing import BaseFormModel, form_model


@form_model
class AssignUsersForm(BaseFormModel):
    assigned_users: list[str]


@form_model
class ChangeColumnOrderForm(BaseFormModel):
    order: int


@form_model
class ChangeOrderForm(BaseFormModel):
    order: int
    parent_uid: str = ""
