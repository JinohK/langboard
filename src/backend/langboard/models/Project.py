from sqlmodel import Field
from ..core.db import SoftDeleteModel
from ..core.utils.String import create_short_unique_id
from .User import User


class Project(SoftDeleteModel, table=True):
    uid: str = Field(default_factory=lambda: create_short_unique_id(10), unique=True, nullable=False)
    owner_id: int = Field(foreign_key=User.expr("id"), nullable=False)
    title: str = Field(nullable=False)
    description: str | None = Field(default=None, nullable=True)
    project_type: str = Field(default="Other", nullable=False)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["uid", "title", "project_type"]
