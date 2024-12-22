from typing import Any
from sqlmodel import Field
from ..core.db import EditorContentModel, ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Project import Project


class ProjectWiki(SoftDeleteModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False)
    title: str = Field(nullable=False)
    content: EditorContentModel | None = Field(default=None, sa_type=ModelColumnType(EditorContentModel))
    order: int = Field(default=0, nullable=False)
    is_public: bool = Field(default=True, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
            "content": self.content.model_dump() if self.content else None,
            "order": self.order,
            "is_public": self.is_public,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "title", "order", "is_public"]
