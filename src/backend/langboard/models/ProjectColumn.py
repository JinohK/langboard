from typing import Any, ClassVar
from sqlmodel import Field
from ..core.db import SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Project import Project


class ProjectColumn(SoftDeleteModel, table=True):
    DEFAULT_ARCHIVE_COLUMN_NAME: ClassVar[str] = "Archive"
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    name: str = Field(nullable=False)
    order: int = Field(default=1, nullable=False)
    is_archive: bool = Field(default=False, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "name": self.name,
            "order": self.order,
            "is_archive": self.is_archive,
        }

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "name", "order", "is_archive"]
