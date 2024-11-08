from sqlmodel import Field
from .BaseActivityModel import BaseActivityModel
from .Project import Project


class ProjectActivity(BaseActivityModel, table=True):
    project_id: int = Field(foreign_key=Project.expr("id"), nullable=False)
