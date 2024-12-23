from enum import Enum
from .BaseRoleModel import BaseRoleModel, SnowflakeID, SnowflakeIDField
from .Project import Project


class ProjectRoleAction(Enum):
    Read = "read"  # included card_read
    Update = "update"
    Delete = "delete"
    CardWrite = "card_write"
    CardUpdate = "card_update"
    CardDelete = "card_delete"


class ProjectRole(BaseRoleModel, table=True):
    project_id: SnowflakeID = SnowflakeIDField(foreign_key=Project.expr("id"), nullable=False, index=True)

    @staticmethod
    def get_default_actions() -> list[Enum]:
        return [ProjectRoleAction.Read]
