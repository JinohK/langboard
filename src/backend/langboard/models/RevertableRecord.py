from datetime import datetime, timedelta
from enum import Enum
from typing import Any
from sqlalchemy import JSON
from sqlmodel import Field
from ..core.db import BaseSqlModel, DateTimeField, SnowflakeID, SnowflakeIDField
from ..core.utils.DateTime import now
from ..core.utils.String import create_short_unique_id


class RevertType(Enum):
    Insert = "insert"
    Update = "update"
    Delete = "delete"


class RevertableRecord(BaseSqlModel, table=True):
    revert_key: str = Field(nullable=False)
    target_id: SnowflakeID = SnowflakeIDField(nullable=False)
    table_name: str = Field(nullable=False)
    column_values: dict = Field(default="", sa_type=JSON)
    file_column_names: list[str] | None = Field(default=None, sa_type=JSON)
    valid_until: datetime = DateTimeField(default=lambda: now() + timedelta(minutes=1), nullable=False)
    revert_type: RevertType = Field(nullable=False)
    is_purged: bool = Field(default=False)
    is_soft_delete: bool = Field(default=False)

    @staticmethod
    def create_revert_key() -> str:
        return create_short_unique_id(16)

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["target_id", "table_name", "valid_until", "revert_type", "is_purged", "is_soft_delete"]
