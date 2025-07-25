import * as ProjectCardRelationship from "@/core/models/ProjectCardRelationship";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import * as Project from "@/core/models/Project";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
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
import useCardColumnChangedHandlers from "@/controllers/socket/card/useCardColumnChangedHandlers";
import useCardDeletedHandlers from "@/controllers/socket/card/useCardDeletedHandlers";
import useMetadataUpdatedHandlers from "@/controllers/socket/metadata/useMetadataUpdatedHandlers";
import useMetadataDeletedHandlers from "@/controllers/socket/metadata/useMetadataDeletedHandlers";
import { Utils } from "@langboard/core/utils";

export interface Interface extends IBaseModel {
    project_uid: string;
    column_uid: string;
    title: string;
    description: IEditorContent;
    ai_description?: string;
    order: number;
    created_at: Date;
    deadline_at?: Date;
    archived_at?: Date;
}

export interface IStore extends Interface {
    count_comment: number;
    member_uids: string[];
    column_name: string;
    current_auth_role_actions: Project.TRoleActions[];
    project_members: User.Interface[];
    labels: ProjectLabel.Interface[];
    relationships: ProjectCardRelationship.Interface[];

    // variable set from the client side
    isCollapseOpened?: bool;
}

class ProjectCard extends BaseModel<IStore> {
    public static override get FOREIGN_MODELS() {
        return {
            project_members: User.Model.MODEL_NAME,
            labels: ProjectLabel.Model.MODEL_NAME,
            relationships: ProjectCardRelationship.Model.MODEL_NAME,
        };
    }
    override get FOREIGN_MODELS() {
        return ProjectCard.FOREIGN_MODELS;
    }
    public static get MODEL_NAME() {
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
    }

    public static convertModel(model: IStore): IStore {
        if (Utils.Type.isString(model.created_at)) {
            model.created_at = new Date(model.created_at);
        }
        if (Utils.Type.isString(model.deadline_at)) {
            model.deadline_at = new Date(model.deadline_at);
        }
        if (Utils.Type.isString(model.archived_at)) {
            model.archived_at = new Date(model.archived_at);
        }
        return model;
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value) {
        this.update({ project_uid: value });
    }

    public get column_uid() {
        return this.getValue("column_uid");
    }
    public set column_uid(value) {
        this.update({ column_uid: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value) {
        this.update({ title: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value) {
        this.update({ description: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value) {
        this.update({ order: value });
    }

    public get created_at(): Date {
        return this.getValue("created_at");
    }
    public set created_at(value: string | Date) {
        this.update({ created_at: new Date(value) });
    }

    public get archived_at(): Date | undefined {
        return this.getValue("archived_at");
    }
    public set archived_at(value: string | Date | undefined) {
        this.update({ archived_at: Utils.Type.isString(value) ? new Date(value) : value });
    }

    public get count_comment() {
        return this.getValue("count_comment");
    }
    public set count_comment(value) {
        this.update({ count_comment: value });
    }

    public get member_uids() {
        return this.getValue("member_uids");
    }
    public set member_uids(value) {
        this.update({ member_uids: value });
    }

    public get deadline_at(): Date | undefined {
        return this.getValue("deadline_at");
    }
    public set deadline_at(value: string | Date | undefined) {
        this.update({ deadline_at: Utils.Type.isString(value) ? new Date(value) : value });
    }

    public get column_name() {
        return this.getValue("column_name");
    }
    public set column_name(value) {
        this.update({ column_name: value });
    }

    public get current_auth_role_actions() {
        return this.getValue("current_auth_role_actions");
    }
    public set current_auth_role_actions(value) {
        this.update({ current_auth_role_actions: value });
    }

    public get project_members(): User.TModel[] {
        return this.getForeignValue("project_members");
    }
    public set project_members(value: (User.TModel | User.Interface)[]) {
        this.update({ project_members: value });
    }

    public get labels(): ProjectLabel.TModel[] {
        return this.getForeignValue("labels");
    }
    public set labels(value: (ProjectLabel.TModel | ProjectLabel.Interface)[]) {
        this.update({ labels: value });
    }

    public get relationships(): ProjectCardRelationship.TModel[] {
        return this.getForeignValue("relationships");
    }
    public set relationships(value: (ProjectCardRelationship.TModel | ProjectCardRelationship.Interface)[]) {
        this.update({ relationships: value });
    }

    public get isCollapseOpened() {
        return this.getValue("isCollapseOpened");
    }
    public set isCollapseOpened(value) {
        this.update({ isCollapseOpened: value });
    }
}

registerModel(ProjectCard);

export type TModel = ProjectCard;
export const Model = ProjectCard;
