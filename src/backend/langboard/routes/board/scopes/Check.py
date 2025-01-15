from ....core.routing import BaseFormModel, form_model
from ....models.Checkitem import CheckitemStatus


@form_model
class CardCheckRelatedForm(BaseFormModel):
    title: str


@form_model
class ChangeCardCheckitemStatusForm(BaseFormModel):
    status: CheckitemStatus


@form_model
class CardCheckGroupNotifyForm(BaseFormModel):
    member_uids: list[str]


@form_model
class CardifyCheckitemForm(BaseFormModel):
    column_uid: str
