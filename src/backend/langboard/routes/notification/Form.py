from datetime import datetime
from ...core.routing import BaseFormModel, form_model
from ...core.schema import Pagination
from ...core.utils.DateTime import now


class NotificationListPagination(Pagination):
    current_date: datetime = now()


@form_model
class UpdateProjectDetailsForm(BaseFormModel):
    title: str
    description: str | None = None
    project_type: str = "Other"
