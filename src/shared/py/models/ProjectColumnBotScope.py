from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScopeModel, BotTriggerCondition
from .ProjectColumn import ProjectColumn


class ProjectColumnBotScope(BaseBotScopeModel, table=True):
    project_column_id: SnowflakeID = SnowflakeIDField(foreign_key=ProjectColumn, nullable=False, index=True)

    @staticmethod
    def get_available_conditions() -> set[BotTriggerCondition]:
        return {
            BotTriggerCondition.ProjectColumnNameChanged,
            BotTriggerCondition.ProjectColumnDeleted,
            BotTriggerCondition.CardCreated,
            BotTriggerCondition.CardUpdated,
            BotTriggerCondition.CardMoved,
            BotTriggerCondition.CardLabelsUpdated,
            BotTriggerCondition.CardRelationshipsUpdated,
            BotTriggerCondition.CardDeleted,
            BotTriggerCondition.CardAttachmentUploaded,
            BotTriggerCondition.CardAttachmentNameChanged,
            BotTriggerCondition.CardAttachmentDeleted,
            BotTriggerCondition.CardCommentAdded,
            BotTriggerCondition.CardCommentUpdated,
            BotTriggerCondition.CardCommentDeleted,
            BotTriggerCondition.CardCommentReacted,
            BotTriggerCondition.CardCommentUnreacted,
            BotTriggerCondition.CardChecklistCreated,
            BotTriggerCondition.CardChecklistTitleChanged,
            BotTriggerCondition.CardChecklistChecked,
            BotTriggerCondition.CardChecklistUnchecked,
            BotTriggerCondition.CardChecklistDeleted,
            BotTriggerCondition.CardCheckitemCreated,
            BotTriggerCondition.CardCheckitemTitleChanged,
            BotTriggerCondition.CardCheckitemTimerStarted,
            BotTriggerCondition.CardCheckitemTimerPaused,
            BotTriggerCondition.CardCheckitemTimerStopped,
            BotTriggerCondition.CardCheckitemChecked,
            BotTriggerCondition.CardCheckitemUnchecked,
            BotTriggerCondition.CardCheckitemCardified,
            BotTriggerCondition.CardCheckitemDeleted,
        }

    @staticmethod
    def get_scope_column_name() -> str:
        return "project_column_id"

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseBotScopeModel.api_schema(
            {
                "project_column_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        return {
            "project_column_uid": self.project_column_id.to_short_code(),
            **(super().api_response()),
        }
