from pydantic import Field
from ....core.routing import BaseFormModel, form_model
from ....core.schema import Pagination
from ....core.types import SafeDateTime
from ....models.ProjectRole import ProjectRoleAction


@form_model
class InviteProjectMemberForm(BaseFormModel):
    emails: list[str]


@form_model
class ProjectInvitationForm(BaseFormModel):
    invitation_token: str


class ChatHistoryPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()


@form_model
class UpdateProjectDetailsForm(BaseFormModel):
    title: str = Field(..., description="Project title")
    description: str | None = Field(None, description="Project description")
    project_type: str = Field("Other", description="Project type")


@form_model
class UpdateRolesForm(BaseFormModel):
    roles: list[ProjectRoleAction]
