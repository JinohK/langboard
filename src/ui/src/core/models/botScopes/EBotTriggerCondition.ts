export enum EBotTriggerCondition {
    // Project Column
    ProjectColumnNameChanged = "project_column_name_changed",
    ProjectColumnDeleted = "project_column_deleted",

    // Card
    CardCreated = "card_created",
    CardUpdated = "card_updated",
    CardMoved = "card_moved",
    CardLabelsUpdated = "card_labels_updated",
    CardRelationshipsUpdated = "card_relationships_updated",
    CardDeleted = "card_deleted",

    // Card Attachment
    CardAttachmentUploaded = "card_attachment_uploaded",
    CardAttachmentNameChanged = "card_attachment_name_changed",
    CardAttachmentDeleted = "card_attachment_deleted",

    // Card Comment
    CardCommentAdded = "card_comment_added",
    CardCommentUpdated = "card_comment_updated",
    CardCommentDeleted = "card_comment_deleted",
    CardCommentReacted = "card_comment_reacted",
    CardCommentUnreacted = "card_comment_unreacted",

    // Card Checklist
    CardChecklistCreated = "card_checklist_created",
    CardChecklistTitleChanged = "card_checklist_title_changed",
    CardChecklistChecked = "card_checklist_checked",
    CardChecklistUnchecked = "card_checklist_unchecked",
    CardChecklistDeleted = "card_checklist_deleted",

    // Card Checkitem
    CardCheckitemCreated = "card_checkitem_created",
    CardCheckitemTitleChanged = "card_checkitem_title_changed",
    CardCheckitemTimerStarted = "card_checkitem_timer_started",
    CardCheckitemTimerPaused = "card_checkitem_timer_paused",
    CardCheckitemTimerStopped = "card_checkitem_timer_stopped",
    CardCheckitemChecked = "card_checkitem_checked",
    CardCheckitemUnchecked = "card_checkitem_unchecked",
    CardCheckitemCardified = "card_checkitem_cardified",
    CardCheckitemDeleted = "card_checkitem_deleted",
}

export const COLUMN_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    project_column: [EBotTriggerCondition.ProjectColumnNameChanged, EBotTriggerCondition.ProjectColumnDeleted],
};

export const CARD_CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    card: [
        EBotTriggerCondition.CardUpdated,
        EBotTriggerCondition.CardMoved,
        EBotTriggerCondition.CardLabelsUpdated,
        EBotTriggerCondition.CardRelationshipsUpdated,
        EBotTriggerCondition.CardDeleted,
    ],
    card_attachment: [
        EBotTriggerCondition.CardAttachmentUploaded,
        EBotTriggerCondition.CardAttachmentNameChanged,
        EBotTriggerCondition.CardAttachmentDeleted,
    ],
    card_comment: [
        EBotTriggerCondition.CardCommentAdded,
        EBotTriggerCondition.CardCommentUpdated,
        EBotTriggerCondition.CardCommentDeleted,
        EBotTriggerCondition.CardCommentReacted,
        EBotTriggerCondition.CardCommentUnreacted,
    ],
    card_checklist: [
        EBotTriggerCondition.CardChecklistCreated,
        EBotTriggerCondition.CardChecklistTitleChanged,
        EBotTriggerCondition.CardChecklistChecked,
        EBotTriggerCondition.CardChecklistUnchecked,
        EBotTriggerCondition.CardChecklistDeleted,
    ],
    card_checkitem: [
        EBotTriggerCondition.CardCheckitemCreated,
        EBotTriggerCondition.CardCheckitemTitleChanged,
        EBotTriggerCondition.CardCheckitemTimerStarted,
        EBotTriggerCondition.CardCheckitemTimerPaused,
        EBotTriggerCondition.CardCheckitemTimerStopped,
        EBotTriggerCondition.CardCheckitemChecked,
        EBotTriggerCondition.CardCheckitemUnchecked,
        EBotTriggerCondition.CardCheckitemCardified,
        EBotTriggerCondition.CardCheckitemDeleted,
    ],
};
