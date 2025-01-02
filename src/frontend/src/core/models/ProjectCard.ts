import * as GlobalRelationshipType from "@/core/models/GlobalRelationshipType";
import * as ProjectCardAttachment from "@/core/models/ProjectCardAttachment";
import * as ProjectCardRelationship from "@/core/models/ProjectCardRelationship";
import * as ProjectCheckitem from "@/core/models/ProjectCheckitem";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent, registerModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";
import useCardCommentAddedHandlers from "@/controllers/socket/card/comment/useCardCommentAddedHandlers";
import useCardCommentDeletedHandlers from "@/controllers/socket/card/comment/useCardCommentDeletedHandlers";
import useCardAssignedUsersUpdatedHandlers from "@/controllers/socket/card/useCardAssignedUsersUpdatedHandlers";
import useCardLabelsUpdatedHandlers from "@/controllers/socket/card/useCardLabelsUpdatedHandlers";
import useCardCheckitemDeletedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemDeletedHandlers";
import useCardCheckitemCreatedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCreatedHandlers";
import useCardCommentReactedHandlers from "@/controllers/socket/card/comment/useCardCommentReactedHandlers";
import useCardAttachmentUploadedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentUploadedHandlers";
import useCardAttachmentDeletedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentDeletedHandlers";
import useCardDetailsChangedHandlers from "@/controllers/socket/card/useCardDetailsChangedHandlers";

export interface Interface extends IBaseModel {
    project_uid: string;
    column_uid: string;
    title: string;
    description?: IEditorContent;
    order: number;
}

export interface IStore extends Interface {
    count_comment: number;
    members: User.Interface[];
    label_uids: string[];
    deadline_at?: Date;
    column_name: string;
    project_all_columns: ProjectColumn.Interface[];
    project_members: User.Interface[];
    project_labels: ProjectLabel.Interface[];
    labels: ProjectLabel.Interface[];
    global_relationships: GlobalRelationshipType.Interface[];
    relationships: ProjectCardRelationship.Interface[];
    attachments: ProjectCardAttachment.IStore[];
    checkitems: ProjectCheckitem.IStore[];

    // variable set from the client side
    isArchived: bool;
    isOpenedInBoardColumn: bool;
}

class ProjectCard extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            members: User.Model.MODEL_NAME,
            project_all_columns: ProjectColumn.Model.MODEL_NAME,
            project_members: User.Model.MODEL_NAME,
            project_labels: ProjectLabel.Model.MODEL_NAME,
            labels: ProjectLabel.Model.MODEL_NAME,
            global_relationships: GlobalRelationshipType.Model.MODEL_NAME,
            relationships: ProjectCardRelationship.Model.MODEL_NAME,
            attachments: ProjectCardAttachment.Model.MODEL_NAME,
            checkitems: ProjectCheckitem.Model.MODEL_NAME,
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
                useCardAssignedUsersUpdatedHandlers,
                useCardLabelsUpdatedHandlers,
                useCardCheckitemCreatedHandlers,
                useCardCheckitemDeletedHandlers,
                useCardAttachmentUploadedHandlers,
                useCardAttachmentDeletedHandlers,
            ],
            {
                projectUID: this.project_uid,
                uid: this.uid,
                cardUID: this.uid,
            }
        );
        ProjectColumn.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.project_all_columns = [...this.project_all_columns, ...models];
            },
            (model) => model.project_uid === this.project_uid
        );
        ProjectColumn.Model.subscribe("DELETION", this.uid, (uids) => {
            this.project_all_columns = this.project_all_columns.filter((column) => !uids.includes(column.uid));
        });
        ProjectLabel.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.project_labels = [...this.project_labels, ...models];
            },
            (model) => model.project_uid === this.project_uid
        );
        ProjectLabel.Model.subscribe("DELETION", this.uid, (uids) => {
            this.project_labels = this.project_labels.filter((label) => !uids.includes(label.uid));
            this.labels = this.labels.filter((label) => !uids.includes(label.uid));
        });
        GlobalRelationshipType.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.global_relationships = [...this.global_relationships, ...models];
            },
            () => true
        );
        GlobalRelationshipType.Model.subscribe("DELETION", this.uid, (uids) => {
            this.global_relationships = this.global_relationships.filter((relationship) => !uids.includes(relationship.uid));
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
        ProjectCheckitem.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.checkitems = [...this.checkitems, ...models];
            },
            (model) => model.card_uid === this.uid
        );
        ProjectCheckitem.Model.subscribe("DELETION", this.uid, (uids) => {
            this.checkitems = this.checkitems.filter((checkitem) => !uids.includes(checkitem.uid));
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
        if (TypeUtils.isString(model.deadline_at)) {
            model.deadline_at = new Date(model.deadline_at);
        }
        if (model.column_uid && model.project_uid) {
            model.isArchived = model.column_uid === model.project_uid;
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
        this.update({ column_uid: value, isArchived: value === this.project_uid });
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
    public set description(value: IEditorContent | undefined) {
        this.update({ description: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value: number) {
        this.update({ order: value });
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

    public get label_uids() {
        return this.getValue("label_uids");
    }
    public set label_uids(value: string[]) {
        this.update({ label_uids: value });
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

    public get project_all_columns(): ProjectColumn.TModel[] {
        return this.getForeignModels("project_all_columns");
    }
    public set project_all_columns(value: (ProjectColumn.TModel | ProjectColumn.Interface)[]) {
        this.update({ project_all_columns: value });
    }

    public get project_members(): User.TModel[] {
        return this.getForeignModels("project_members");
    }
    public set project_members(value: (User.TModel | User.Interface)[]) {
        this.update({ project_members: value });
    }

    public get project_labels(): ProjectLabel.TModel[] {
        return this.getForeignModels("project_labels");
    }
    public set project_labels(value: (ProjectLabel.TModel | ProjectLabel.Interface)[]) {
        this.update({ project_labels: value });
    }

    public get labels(): ProjectLabel.TModel[] {
        return this.getForeignModels("labels");
    }
    public set labels(value: (ProjectLabel.TModel | ProjectLabel.Interface)[]) {
        this.update({ labels: value });
    }

    public get global_relationships(): GlobalRelationshipType.TModel[] {
        return this.getForeignModels("global_relationships");
    }
    public set global_relationships(value: (GlobalRelationshipType.TModel | GlobalRelationshipType.Interface)[]) {
        this.update({ global_relationships: value });
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

    public get checkitems(): ProjectCheckitem.TModel[] {
        return this.getForeignModels("checkitems");
    }
    public set checkitems(value: (ProjectCheckitem.TModel | ProjectCheckitem.IStore)[]) {
        this.update({ checkitems: value });
    }

    public get isArchived() {
        return this.getValue("isArchived");
    }
    public set isArchived(value: bool) {
        this.update({ isArchived: value });
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
