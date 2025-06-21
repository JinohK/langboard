import { TProjectActivityInterface } from "@/core/models/activities/project.activity.type";
import { TProjectCardActivityInterface } from "@/core/models/activities/project.card.activity.type";
import { TProjectCardAttachmentActivityInterface } from "@/core/models/activities/project.card.attachment.activity.type";
import { TProjectCardCheckitemActivityInterface } from "@/core/models/activities/project.card.checkitem.activity.type";
import { TProjectCardChecklistActivityInterface } from "@/core/models/activities/project.card.checklist.activity.type";
import { TProjectCardCommentActivity } from "@/core/models/activities/project.card.comment.activity.type";
import { TProjectCardRelationshipActivityInterface } from "@/core/models/activities/project.card.relationship.activity.type";
import { TProjectColumnActivityInterface } from "@/core/models/activities/project.column.activity.type";
import { TProjectLabelActivityInterface } from "@/core/models/activities/project.label.activity.type";

export type TProjectRelatedActivityInterface =
    | TProjectActivityInterface
    | TProjectCardActivityInterface
    | TProjectCardAttachmentActivityInterface
    | TProjectCardCheckitemActivityInterface
    | TProjectCardChecklistActivityInterface
    | TProjectCardCommentActivity
    | TProjectCardRelationshipActivityInterface
    | TProjectColumnActivityInterface
    | TProjectLabelActivityInterface;
