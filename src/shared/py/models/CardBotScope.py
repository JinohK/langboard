from typing import Any
from core.db import SnowflakeIDField
from core.types import SnowflakeID
from .bases import BaseBotScopeModel, BotTriggerCondition
from .Card import Card


class CardBotScope(BaseBotScopeModel, table=True):
    card_id: SnowflakeID = SnowflakeIDField(foreign_key=Card, nullable=False, index=True)

    @staticmethod
    def get_available_conditions() -> set[BotTriggerCondition]:
        return {
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
        return "card_id"

    @staticmethod
    def api_schema(schema: dict | None = None) -> dict[str, Any]:
        return BaseBotScopeModel.api_schema(
            {
                "card_uid": "string",
                **(schema or {}),
            }
        )

    def api_response(self) -> dict[str, Any]:
        return {
            "card_uid": self.card_id.to_short_code(),
            **(super().api_response()),
        }
