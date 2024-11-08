from sqlmodel import Field
from .BaseActivityModel import BaseActivityModel
from .Task import Task


class TaskActivity(BaseActivityModel, table=True):
    task_id: int = Field(foreign_key=Task.expr("id"), nullable=False)
