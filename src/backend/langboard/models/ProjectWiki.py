from typing import Any
from sqlmodel import Field
from ..core.db import EditorContentModel, ModelColumnType, SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .Project import Project


class ProjectWiki(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)
    title: str = Field(nullable=False)
    content: EditorContentModel | None = Field(default=None, sa_type=ModelColumnType(EditorContentModel))
    order: int = Field(default=0, nullable=False)
    is_public: bool = Field(default=True, nullable=False)

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.uid,
            "title": self.title,
            "content": self.content.model_dump() if self.content else None,
            "order": self.order,
            "is_public": self.is_public,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "project_id", "title", "order", "is_public"]
