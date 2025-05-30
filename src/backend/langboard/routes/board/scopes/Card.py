from pydantic import Field
from ....core.db import EditorContentModel
from ....core.routing import BaseFormModel, form_model


@form_model
class CreateCardForm(BaseFormModel):
    title: str = Field(..., title="Title of the card")
    column_uid: str = Field(..., title="UID of the column")
    description: EditorContentModel | None = Field(default=None, title="Description of the card")
    assign_users: list[str] | None = Field(default=None, title="List of user UIDs to assign to the card")


@form_model
class ChangeCardDetailsForm(BaseFormModel):
    title: str | None = Field(default=None, title="Title of the card")
    deadline_at: str | None = Field(default=None, title="Deadline of the card")
    description: EditorContentModel | None = Field(default=None, title="Description of the card")


@form_model
class UpdateCardLabelsForm(BaseFormModel):
    labels: list[str] = Field(..., title="List of label UIDs")


@form_model
class UpdateCardRelationshipsForm(BaseFormModel):
    is_parent: bool = Field(..., title="Is the card that is being updated the parent card?")
    relationships: list[tuple[str, str]] = Field(..., title="List of tuples of card UID and relationship type UID")
