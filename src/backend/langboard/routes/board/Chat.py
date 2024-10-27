from datetime import datetime
from ...core.schema import Pagination


class ChatHistoryPagination(Pagination):
    current_date: datetime
