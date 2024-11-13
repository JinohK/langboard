from typing import Any
from pydantic import BaseModel
from ...core.routing import BaseFormModel, form_model


class DashboardProjectListResponse(BaseModel):
    projects: list[dict[str, Any]]


@form_model
class DashboardProjectCreateForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"
