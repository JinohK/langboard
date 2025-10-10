from core.schema import Pagination
from core.types import SafeDateTime


class ActivityPagination(Pagination):
    assignee_uid: str | None = None
    refer_time: SafeDateTime = SafeDateTime.now()
    only_count: bool = False
