from enum import Enum
from typing import Any
from sqlalchemy import JSON
from sqlmodel import Field
from ..core.ai import BotType
from ..core.db import BaseSqlModel
from .User import User


class ActivityType(Enum):
    UserGroupCreated = "user_group.created"
    UserGroupAssignedUser = "user_group.assigned_user"
    ProjectCreated = "project.created"
    ProjectUpdated = "project.updated"
    ProjectAssignedUser = "project.assigned_user"
    ProjectUnassignedUser = "project.unassigned_user"
    ProjectColumnChangedOrder = "project.column.changed_order"
    CardCreated = "card.created"
    CardUpdated = "card.updated"
    CardChangedColumn = "card.changed_column"
    CardAttachmentAttached = "card.attachment.attached"
    CardAttachmentChangedName = "card.attachment.changed_name"
    CardAttachmentDeleted = "card.attachment.deleted"
    CardCommentAdded = "card.comment.added"
    CardCommentUpdated = "card.comment.updated"
    CardCommentDeleted = "card.comment.deleted"
    CardCheckitemCreated = "card.checkitem.created"
    CardCheckitemChangedTitle = "card.checkitem.changed_title"
    CardSubCheckitemCreated = "card.sub_checkitem.created"
    CardCheckitemCardified = "card.checkitem.cardified"
    CardCheckitemDeleted = "card.checkitem.deleted"
    CardCheckitemTimerStarted = "card.checkitem.timer.started"
    CardCheckitemTimerStopped = "card.checkitem.timer.stopped"


class BaseActivityModel(BaseSqlModel):
    activity: dict[str, Any] = Field(default={}, sa_type=JSON)
    activity_type: ActivityType = Field(nullable=False)
    user_id: int | None = Field(default=None, foreign_key=User.expr("id"), nullable=True)
    bot_type: BotType | None = Field(default=None, nullable=True)

    def get_filterable_columns(self) -> list[str]:
        if not isinstance(self, BaseActivityModel) and (
            not isinstance(self, type) or not issubclass(self, BaseActivityModel)
        ):
            return []

        return [field for field in self.model_fields if field not in BaseActivityModel.model_fields]

    def api_response(self):
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        keys: list[str | tuple[str, str]] = ["activity_type", "user_id"]
        keys.extend(self.get_filterable_columns())
        return keys
