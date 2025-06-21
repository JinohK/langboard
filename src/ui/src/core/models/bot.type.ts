export enum EBotTriggerCondition {
    // Project
    ProjectUpdated = "project_updated",
    ProjectDeleted = "project_deleted",

    // Project Column
    ProjectColumnCreated = "project_column_created",
    ProjectColumnNameChanged = "project_column_name_changed",
    ProjectColumnDeleted = "project_column_deleted",

    // Project Label
    ProjectLabelCreated = "project_label_created",
    ProjectLabelUpdated = "project_label_updated",
    ProjectLabelDeleted = "project_label_deleted",

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

    // Project Wiki
    WikiCreated = "wiki_created",
    WikiUpdated = "wiki_updated",
    WikiPublicityChanged = "wiki_publicity_changed",
    WikiDeleted = "wiki_deleted",
}

export const CATEGORIZED_BOT_TRIGGER_CONDITIONS = {
    project: [EBotTriggerCondition.ProjectUpdated, EBotTriggerCondition.ProjectDeleted],
    project_column: [
        EBotTriggerCondition.ProjectColumnCreated,
        EBotTriggerCondition.ProjectColumnNameChanged,
        EBotTriggerCondition.ProjectColumnDeleted,
    ],
    project_label: [EBotTriggerCondition.ProjectLabelCreated, EBotTriggerCondition.ProjectLabelUpdated, EBotTriggerCondition.ProjectLabelDeleted],
    card: [
        EBotTriggerCondition.CardCreated,
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
    project_wiki: [
        EBotTriggerCondition.WikiCreated,
        EBotTriggerCondition.WikiUpdated,
        EBotTriggerCondition.WikiPublicityChanged,
        EBotTriggerCondition.WikiDeleted,
    ],
};
