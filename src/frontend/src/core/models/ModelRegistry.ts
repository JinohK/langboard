/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Model as ActivityModel } from "@/core/models/ActivityModel";
import type { Model as AppSettingModel } from "@/core/models/AppSettingModel";
import type { Model as AuthUserModel } from "@/core/models/AuthUser";
import type { Model as BotModel } from "@/core/models/BotModel";
import type { Model as BotSchedule } from "@/core/models/BotSchedule";
import type { Model as ChatMessageModel } from "@/core/models/ChatMessageModel";
import type { Model as ChatTemplateModel } from "@/core/models/ChatTemplateModel";
import type { Model as GlobalRelationshipTypeModel } from "@/core/models/GlobalRelationshipType";
import type { Model as MetadataModel } from "@/core/models/MetadataModel";
import type { Model as ProjectModel } from "@/core/models/Project";
import type { Model as ProjectCardModel } from "@/core/models/ProjectCard";
import type { Model as ProjectCardAttachmentModel } from "@/core/models/ProjectCardAttachment";
import type { Model as ProjectCardCommentModel } from "@/core/models/ProjectCardComment";
import type { Model as ProjectCardRelationshipModel } from "@/core/models/ProjectCardRelationship";
import type { Model as ProjectChecklistModel } from "@/core/models/ProjectChecklist";
import type { Model as ProjectCheckitemModel } from "@/core/models/ProjectCheckitem";
import type { Model as ProjectColumnModel } from "@/core/models/ProjectColumn";
import type { Model as ProjectLabelModel } from "@/core/models/ProjectLabel";
import type { Model as ProjectWikiModel } from "@/core/models/ProjectWiki";
import type { Model as UserModel } from "@/core/models/User";
import type { Model as UserGroupModel } from "@/core/models/UserGroup";
import type { Model as UserNotificationModel } from "@/core/models/UserNotification";

export interface IModelMap {
    ActivityModel: typeof ActivityModel;
    AppSettingModel: typeof AppSettingModel;
    AuthUser: typeof AuthUserModel;
    BotModel: typeof BotModel;
    BotSchedule: typeof BotSchedule;
    ChatMessageModel: typeof ChatMessageModel;
    ChatTemplateModel: typeof ChatTemplateModel;
    GlobalRelationshipType: typeof GlobalRelationshipTypeModel;
    MetadataModel: typeof MetadataModel;
    Project: typeof ProjectModel;
    ProjectCard: typeof ProjectCardModel;
    ProjectCardAttachment: typeof ProjectCardAttachmentModel;
    ProjectCardComment: typeof ProjectCardCommentModel;
    ProjectCardRelationship: typeof ProjectCardRelationshipModel;
    ProjectChecklist: typeof ProjectChecklistModel;
    ProjectCheckitem: typeof ProjectCheckitemModel;
    ProjectColumn: typeof ProjectColumnModel;
    ProjectLabel: typeof ProjectLabelModel;
    ProjectWiki: typeof ProjectWikiModel;
    User: typeof UserModel;
    UserGroup: typeof UserGroupModel;
    UserNotification: typeof UserNotificationModel;
}

export const MODEL_REGISTRIES: IModelMap = {} as any;
export const registerModel = (model: IModelMap[keyof IModelMap]) => {
    MODEL_REGISTRIES[model.MODEL_NAME] = model as any;
};
