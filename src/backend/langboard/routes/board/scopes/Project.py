from datetime import datetime
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination
from ....core.utils.DateTime import now


@form_model
class InviteProjectMemberForm(BaseFormModel):
    url: str
    token_query_name: str
    emails: list[str]
    lang: str = "en-US"


@form_model
class AcceptProjectInvitationForm(BaseFormModel):
    invitation_token: str


class ChatHistoryPagination(Pagination):
    current_date: datetime = now()


@form_model
class UpdateProjectDetailsForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"
