from datetime import datetime, timezone


def now():
    return datetime.now(timezone.utc)


def calculate_time_diff_in_seconds(later: datetime, earlier: datetime) -> int:
    later = datetime.replace(later, tzinfo=timezone.utc)
    earlier = datetime.replace(earlier, tzinfo=timezone.utc)
    return int((later - earlier).total_seconds())
