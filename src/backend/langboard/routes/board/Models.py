from datetime import datetime
from ...core.routing import BaseFormModel, form_model
from ...core.schema import Pagination


class ChatHistoryPagination(Pagination):
    current_date: datetime


@form_model
class ChangeColumnNameForm(BaseFormModel):
    name: str


@form_model
class ChangeColumnOrderForm(BaseFormModel):
    order: int


@form_model
class ChangeOrderForm(BaseFormModel):
    order: int
    parent_uid: str = ""


@form_model
class ChangeAttachmentNameForm(BaseFormModel):
    attachment_name: str


@form_model
class ChangeCardDetailsForm(BaseFormModel):
    title: str | None = None
    deadline_at: str | None = None
    description: dict | None = None


@form_model
class ToggleCardCommentReactionForm(BaseFormModel):
    reaction: str


@form_model
class CreateCardCheckitemForm(BaseFormModel):
    title: str
    assigned_users: list[int] | None = None


@form_model
class AssignUsersForm(BaseFormModel):
    assigned_users: list[int]


@form_model
class CardifyCheckitemForm(BaseFormModel):
    column_uid: str | None = None
    with_sub_checkitems: bool = False
    with_assign_users: bool = False
