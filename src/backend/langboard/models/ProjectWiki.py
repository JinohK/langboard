from typing import Any
from sqlmodel import Field
from ..core.db import EditorContentModel, ModelColumnType, SnowflakeID, SnowflakeIDField, SoftDeleteModel
from .Project import Project


class ProjectWiki(SoftDeleteModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)
    title: str = Field(nullable=False)
    content: EditorContentModel = Field(default=EditorContentModel(), sa_type=ModelColumnType(EditorContentModel))
    order: int = Field(default=0, nullable=False)
    is_public: bool = Field(default=True, nullable=False)

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return {
            "uid": "string",
            "project_uid": "string",
            "title": "string",
            "content?": EditorContentModel.api_schema(),
            "order": "integer",
            "forbidden": "bool",
            "is_public": "bool",
            **(schema or {}),
        }

    def api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "title": self.title,
            "content": self.content.model_dump(),
            "order": self.order,
            "forbidden": False,
            "is_public": self.is_public,
        }

    def convert_to_private_api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "project_uid": self.project_id.to_short_code(),
            "title": "",
            "content": None,
            "order": self.order,
            "is_public": False,
            "forbidden": True,
            "assigned_bots": [],
            "assigned_members": [],
        }

    def notification_data(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "title": self.title,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["project_id", "title", "order", "is_public"]
