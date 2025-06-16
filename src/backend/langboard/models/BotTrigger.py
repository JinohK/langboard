from enum import Enum
from typing import Any
from sqlmodel import Field
from ..core.db import BaseSqlModel, EnumLikeType, SnowflakeIDField
from ..core.types import SnowflakeID
from .Bot import Bot


class BotTriggerCondition(Enum):
    # Project
    ProjectUpdated = "project_updated"
    ProjectDeleted = "project_deleted"

    # Project Column
    ProjectColumnCreated = "project_column_created"
    ProjectColumnNameChanged = "project_column_name_changed"
    ProjectColumnDeleted = "project_column_deleted"

    # Project Label
    ProjectLabelCreated = "project_label_created"
    ProjectLabelUpdated = "project_label_updated"
    ProjectLabelDeleted = "project_label_deleted"

    # Card
    CardCreated = "card_created"
    CardUpdated = "card_updated"
    CardMoved = "card_moved"
    CardLabelsUpdated = "card_labels_updated"
    CardRelationshipsUpdated = "card_relationships_updated"
    CardDeleted = "card_deleted"

    # Card Attachment
    CardAttachmentUploaded = "card_attachment_uploaded"
    CardAttachmentNameChanged = "card_attachment_name_changed"
    CardAttachmentDeleted = "card_attachment_deleted"

    # Card Comment
    CardCommentAdded = "card_comment_added"
    CardCommentUpdated = "card_comment_updated"
    CardCommentDeleted = "card_comment_deleted"
    CardCommentReacted = "card_comment_reacted"
    CardCommentUnreacted = "card_comment_unreacted"

    # Card Checklist
    CardChecklistCreated = "card_checklist_created"
    CardChecklistTitleChanged = "card_checklist_title_changed"
    CardChecklistChecked = "card_checklist_checked"
    CardChecklistUnchecked = "card_checklist_unchecked"
    CardChecklistDeleted = "card_checklist_deleted"

    # Card Checkitem
    CardCheckitemCreated = "card_checkitem_created"
    CardCheckitemTitleChanged = "card_checkitem_title_changed"
    CardCheckitemTimerStarted = "card_checkitem_timer_started"
    CardCheckitemTimerPaused = "card_checkitem_timer_paused"
    CardCheckitemTimerStopped = "card_checkitem_timer_stopped"
    CardCheckitemChecked = "card_checkitem_checked"
    CardCheckitemUnchecked = "card_checkitem_unchecked"
    CardCheckitemCardified = "card_checkitem_cardified"
    CardCheckitemDeleted = "card_checkitem_deleted"

    # Project Wiki
    WikiCreated = "wiki_created"
    WikiUpdated = "wiki_updated"
    WikiPublicityChanged = "wiki_publicity_changed"
    WikiDeleted = "wiki_deleted"


class BotTrigger(BaseSqlModel, table=True):
    bot_id: SnowflakeID = SnowflakeIDField(foreign_key=Bot, nullable=False, index=True)
    condition: BotTriggerCondition = Field(nullable=False, sa_type=EnumLikeType(BotTriggerCondition))
    is_predefined: bool = Field(default=False, nullable=False)

    @staticmethod
    def api_schema() -> dict[str, Any]:
        return {}

    def api_response(self) -> dict[str, Any]:
        return {}

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["bot_id", "condition", "is_predefined"]
