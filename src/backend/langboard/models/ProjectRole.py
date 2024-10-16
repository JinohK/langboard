from enum import Enum
from sqlmodel import Field
from .BaseRoleModel import BaseRoleModel
from .Project import Project


class ProjectRoleAction(Enum):
    Read = "read"
    Write = "write"
    Update = "update"
    Delete = "delete"


class ProjectRole(BaseRoleModel, table=True):
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)

    @staticmethod
    def get_default_actions() -> list[Enum]:
        return [ProjectRoleAction.Read]
