from datetime import datetime
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination
from ....core.utils.DateTime import now
from ....models.ProjectRole import ProjectRoleAction


@form_model
class InviteProjectMemberForm(BaseFormModel):
    url: str
    token_query_name: str
    emails: list[str]
    lang: str = "en-US"


@form_model
class ProjectInvitationForm(BaseFormModel):
    invitation_token: str


class ChatHistoryPagination(Pagination):
    refer_time: datetime = now()


@form_model
class UpdateProjectDetailsForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"


@form_model
class UpdateMemberRolesForm(BaseFormModel):
    roles: list[ProjectRoleAction]
