from datetime import datetime
from ...core.routing import BaseFormModel, form_model
from ...core.schema import Pagination


class ChatHistoryPagination(Pagination):
    current_date: datetime


@form_model
class ChangeTaskOrderForm(BaseFormModel):
    order: int
    column_uid: str = ""
