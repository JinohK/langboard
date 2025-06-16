from ...core.schema import Pagination
from ...core.types import SafeDateTime


class ActivityPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()
    only_count: bool = False
