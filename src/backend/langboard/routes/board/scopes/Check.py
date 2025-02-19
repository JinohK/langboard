from pydantic import Field
from ....core.routing import BaseFormModel, form_model
from ....models.Checkitem import CheckitemStatus


@form_model
class CardCheckRelatedForm(BaseFormModel):
    title: str = Field(..., title="Title of the checklist or checkitem")


@form_model
class ChangeCardCheckitemStatusForm(BaseFormModel):
    status: CheckitemStatus = Field(
        ..., title=f"Status of the checkitem: {', '.join(CheckitemStatus._value2member_map_)}"
    )


@form_model
class CardChecklistNotifyForm(BaseFormModel):
    user_uids: list[str] = Field(..., title="List of user UIDs")


@form_model
class CardifyCheckitemForm(BaseFormModel):
    column_uid: str = Field(..., title="UID of the project column for the new card that will be created")
