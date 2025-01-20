from datetime import datetime
from ...core.schema import Pagination
from ...core.utils.DateTime import now


class ActivityPagination(Pagination):
    refer_time: datetime = now()
