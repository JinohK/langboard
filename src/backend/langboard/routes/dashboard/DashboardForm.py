from datetime import datetime
from ...core.routing import BaseFormModel, form_model
from ...core.schema import Pagination
from ...core.utils.DateTime import now


@form_model
class DashboardProjectCreateForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"


class DashboardPagination(Pagination):
    refer_time: datetime = now()
