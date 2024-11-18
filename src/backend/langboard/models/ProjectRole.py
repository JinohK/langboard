from enum import Enum
from sqlmodel import Field
from .BaseRoleModel import BaseRoleModel
from .Project import Project


class ProjectRoleAction(Enum):
    Read = "read"  # included card_read
    Update = "update"
    Delete = "delete"
    CardWrite = "card_write"
    CardUpdate = "card_update"
    CardDelete = "card_delete"


class ProjectRole(BaseRoleModel, table=True):
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)

    @staticmethod
    def get_default_actions() -> list[Enum]:
        return [ProjectRoleAction.Read]
