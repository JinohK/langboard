import * as BotModel from "@/core/models/BotModel";
import * as GlobalRelationshipType from "@/core/models/GlobalRelationshipType";
import * as ProjectCardAttachment from "@/core/models/ProjectCardAttachment";
import * as ProjectCardRelationship from "@/core/models/ProjectCardRelationship";
import * as ProjectChecklist from "@/core/models/ProjectChecklist";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import * as Project from "@/core/models/Project";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent, registerModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";
import useCardCommentAddedHandlers from "@/controllers/socket/card/comment/useCardCommentAddedHandlers";
import useCardCommentDeletedHandlers from "@/controllers/socket/card/comment/useCardCommentDeletedHandlers";
import useCardAssignedUsersUpdatedHandlers from "@/controllers/socket/card/useCardAssignedUsersUpdatedHandlers";
import useCardLabelsUpdatedHandlers from "@/controllers/socket/card/useCardLabelsUpdatedHandlers";
import useCardChecklistCreatedHandlers from "@/controllers/socket/card/checklist/useCardChecklistCreatedHandlers";
import useCardChecklistTitleChangedHandlers from "@/controllers/socket/card/checklist/useCardChecklistTitleChangedHandlers";
import useCardChecklistCheckedChangedHandlers from "@/controllers/socket/card/checklist/useCardChecklistCheckedChangedHandlers";
import useCardChecklistDeletedHandlers from "@/controllers/socket/card/checklist/useCardChecklistDeletedHandlers";
import useCardCommentReactedHandlers from "@/controllers/socket/card/comment/useCardCommentReactedHandlers";
import useCardAttachmentUploadedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentUploadedHandlers";
import useCardAttachmentDeletedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentDeletedHandlers";
import useCardDetailsChangedHandlers from "@/controllers/socket/card/useCardDetailsChangedHandlers";
import useCardProjectUsersUpdatedHandlers from "@/controllers/socket/card/useCardProjectUsersUpdatedHandlers";
import useCardProjectBotsUpdatedHandlers from "@/controllers/socket/card/useCardProjectBotsUpdatedHandlers";
import useCardColumnChangedHandlers from "@/controllers/socket/card/useCardColumnChangedHandlers";
import useCardDeletedHandlers from "@/controllers/socket/card/useCardDeletedHandlers";
import useMetadataUpdatedHandlers from "@/controllers/socket/metadata/useMetadataUpdatedHandlers";
import useMetadataDeletedHandlers from "@/controllers/socket/metadata/useMetadataDeletedHandlers";

export interface Interface extends IBaseModel {
    project_uid: string;
    column_uid: string;
    title: string;
    description: IEditorContent;
    order: number;
    created_at: Date;
    archived_at?: Date;
}

export interface IStore extends Interface {
    count_comment: number;
    members: User.Interface[];
    deadline_at?: Date;
    column_name: string;
    current_auth_role_actions: Project.TRoleActions[];
    project_members: User.Interface[];
    project_bots: BotModel.Interface[];
    labels: ProjectLabel.Interface[];
    relationships: ProjectCardRelationship.Interface[];
    attachments: ProjectCardAttachment.IStore[];
    checklists: ProjectChecklist.IStore[];

    // variable set from the client side
    isOpenedInBoardColumn: bool;
}

class ProjectCard extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            members: User.Model.MODEL_NAME,
            project_members: User.Model.MODEL_NAME,
            project_bots: BotModel.Model.MODEL_NAME,
            labels: ProjectLabel.Model.MODEL_NAME,
            relationships: ProjectCardRelationship.Model.MODEL_NAME,
            attachments: ProjectCardAttachment.Model.MODEL_NAME,
            checklists: ProjectChecklist.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectCard" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents(
            [
                useCardDetailsChangedHandlers,
                useCardCommentAddedHandlers,
                useCardCommentDeletedHandlers,
                useCardCommentReactedHandlers,
                useCardProjectBotsUpdatedHandlers,
                useCardProjectUsersUpdatedHandlers,
                useCardAssignedUsersUpdatedHandlers,
                useCardLabelsUpdatedHandlers,
                useCardChecklistCreatedHandlers,
                useCardChecklistTitleChangedHandlers,
                useCardChecklistCheckedChangedHandlers,
                useCardChecklistDeletedHandlers,
                useCardAttachmentUploadedHandlers,
                useCardAttachmentDeletedHandlers,
                useCardColumnChangedHandlers,
                useCardDeletedHandlers,
            ],
            {
                projectUID: this.project_uid,
                uid: this.uid,
                cardUID: this.uid,
                card: this,
            }
        );

        this.subscribeSocketEvents([useMetadataUpdatedHandlers, useMetadataDeletedHandlers], {
            type: "card",
            uid: this.uid,
        });

        ProjectLabel.Model.subscribe("DELETION", this.uid, (uids) => {
            this.labels = this.labels.filter((label) => !uids.includes(label.uid));
        });
        GlobalRelationshipType.Model.subscribe("DELETION", this.uid, (uids) => {
            this.relationships = this.relationships.filter((relationship) => !uids.includes(relationship.relationship_type_uid));
        });
        ProjectCardAttachment.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.attachments = [...this.attachments, ...models];
            },
            (model) => model.card_uid === this.uid
        );
        ProjectCardAttachment.Model.subscribe("DELETION", this.uid, (uids) => {
            this.attachments = this.attachments.filter((attachment) => !uids.includes(attachment.uid));
        });
        ProjectChecklist.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.checklists = [...this.checklists, ...models];
            },
            (model) => model.card_uid === this.uid
        );
        ProjectChecklist.Model.subscribe("DELETION", this.uid, (uids) => {
            this.checklists = this.checklists.filter((checklist) => !uids.includes(checklist.uid));
        });
        ProjectCardRelationship.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.relationships = [...this.relationships, ...models];
            },
            (model) => model.parent_card_uid === this.uid || model.child_card_uid === this.uid
        );
        ProjectCardRelationship.Model.subscribe("DELETION", this.uid, (uids) => {
            this.relationships = this.relationships.filter((relationship) => !uids.includes(relationship.uid));
        });
    }

    public static convertModel(model: IStore): IStore {
        if (TypeUtils.isString(model.created_at)) {
            model.created_at = new Date(model.created_at);
        }
        if (TypeUtils.isString(model.deadline_at)) {
            model.deadline_at = new Date(model.deadline_at);
        }
        if (TypeUtils.isString(model.archived_at)) {
            model.archived_at = new Date(model.archived_at);
        }
        if (TypeUtils.isNullOrUndefined(model.isOpenedInBoardColumn)) {
            model.isOpenedInBoardColumn = false;
        }
        return model;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value: string) {
        this.update({ project_uid: value });
    }

    public get column_uid() {
        return this.getValue("column_uid");
    }
    public set column_uid(value: string) {
        this.update({ column_uid: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value: string) {
        this.update({ title: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value: IEditorContent) {
        this.update({ description: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
    }

    public get created_at(): Date {
        return this.getValue("created_at");
    }
    public set created_at(value: string | Date) {
        this.update({ created_at: value });
    }

    public get archived_at(): Date | undefined {
        return this.getValue("archived_at");
    }
    public set archived_at(value: string | Date | undefined) {
        this.update({ archived_at: value });
    }

    public get count_comment() {
        return this.getValue("count_comment");
    }
    public set count_comment(value: number) {
        this.update({ count_comment: value });
    }

    public get members(): User.TModel[] {
        return this.getForeignModels("members");
    }
    public set members(value: (User.TModel | User.Interface)[]) {
        this.update({ members: value });
    }

    public get deadline_at(): Date | undefined {
        return this.getValue("deadline_at");
    }
    public set deadline_at(value: string | Date | undefined) {
        this.update({ deadline_at: value });
    }

    public get column_name() {
        return this.getValue("column_name");
    }
    public set column_name(value: string) {
        this.update({ column_name: value });
    }

    public get current_auth_role_actions() {
        return this.getValue("current_auth_role_actions");
    }
    public set current_auth_role_actions(value: Project.TRoleActions[]) {
        this.update({ current_auth_role_actions: value });
    }

    public get project_members(): User.TModel[] {
        return this.getForeignModels("project_members");
    }
    public set project_members(value: (User.TModel | User.Interface)[]) {
        this.update({ project_members: value });
    }

    public get project_bots(): BotModel.TModel[] {
        return this.getForeignModels("project_bots");
    }
    public set project_bots(value: (BotModel.TModel | BotModel.Interface)[]) {
        this.update({ project_bots: value });
    }

    public get labels(): ProjectLabel.TModel[] {
        return this.getForeignModels("labels");
    }
    public set labels(value: (ProjectLabel.TModel | ProjectLabel.Interface)[]) {
        this.update({ labels: value });
    }

    public get relationships(): ProjectCardRelationship.TModel[] {
        return this.getForeignModels("relationships");
    }
    public set relationships(value: (ProjectCardRelationship.TModel | ProjectCardRelationship.Interface)[]) {
        this.update({ relationships: value });
    }

    public get attachments(): ProjectCardAttachment.TModel[] {
        return this.getForeignModels("attachments");
    }
    public set attachments(value: (ProjectCardAttachment.TModel | ProjectCardAttachment.IStore)[]) {
        this.update({ attachments: value });
    }

    public get checklists(): ProjectChecklist.TModel[] {
        return this.getForeignModels("checklists");
    }
    public set checklists(value: (ProjectChecklist.TModel | ProjectChecklist.IStore)[]) {
        this.update({ checklists: value });
    }

    public get isOpenedInBoardColumn() {
        return this.getValue("isOpenedInBoardColumn");
    }
    public set isOpenedInBoardColumn(value: bool) {
        this.update({ isOpenedInBoardColumn: value });
    }
}

registerModel(ProjectCard);

export type TModel = ProjectCard;
export const Model = ProjectCard;
