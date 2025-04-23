from pydantic import Field
from ....core.routing import BaseFormModel, form_model
from ....models import Card, ProjectColumn


@form_model
class AssignBotsForm(BaseFormModel):
    assigned_bots: list[str] = Field(..., title="List of bot UIDs")


@form_model
class AssignUsersForm(BaseFormModel):
    assigned_users: list[str] = Field(..., title="List of user UIDs")


@form_model
class AssigneesForm(BaseFormModel):
    assignees: list[str] = Field(..., title="List of user and bot UIDs")


@form_model
class ChangeRootOrderForm(BaseFormModel):
    order: int = Field(..., title="New order")


@form_model
class ChangeChildOrderForm(BaseFormModel):
    order: int = Field(..., title="New order")
    parent_uid: str = Field(default="", title="If moving to another parent, the UID of the parent")


@form_model
class BotCronTimeForm(BaseFormModel):
    interval_str: str | None = Field(
        default=None, title="Cron interval string (UNIX crontab format - * * * * *) (Required for init)"
    )
    target_table: str | None = Field(
        default=None,
        title=f"Target table name ({ProjectColumn.__tablename__}, {Card.__tablename__}) (Required for init)",
    )
    target_uid: str | None = Field(default=None, title="Target UID (Required for init)")
