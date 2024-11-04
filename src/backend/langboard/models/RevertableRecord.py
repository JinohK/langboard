from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import JSON, Column
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField
from ..core.utils.DateTime import now
from ..core.utils.String import create_short_unique_id


class RevertType(Enum):
    Insert = "insert"
    Update = "update"
    Delete = "delete"


class RevertableRecord(BaseSqlModel, table=True):
    revert_key: str = Field(default_factory=lambda: create_short_unique_id(16), unique=True, nullable=False)
    target_id: int = Field(nullable=False)
    table_name: str = Field(nullable=False)
    column_values: dict = Field(default="", sa_column=Column(type_=JSON))
    file_column_names: list[str] | None = Field(default=None, sa_column=Column(type_=JSON))
    valid_until: datetime = DateTimeField(default=lambda: now() + timedelta(minutes=1), nullable=False)
    revert_type: RevertType = Field(nullable=False)
    is_purged: bool = Field(default=False)
    is_soft_delete: bool = Field(default=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["target_id", "table_name", "valid_until", "revert_type", "is_purged", "is_soft_delete"]
