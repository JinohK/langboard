from datetime import datetime, timezone


class SafeDateTime(datetime):
    def __new__(cls, year, month=None, day=None, hour=0, minute=0, second=0, microsecond=0, tzinfo=None, *, fold=0):
        self = super().__new__(cls, year, month, day, hour, minute, second, microsecond, tzinfo, fold=fold)

        if self.tzinfo is None:
            self = self.replace(tzinfo=timezone.utc)
        return self

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return handler(datetime)
