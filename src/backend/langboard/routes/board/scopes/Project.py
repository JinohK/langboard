from datetime import datetime
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination


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
    current_date: datetime
