import * as User from "@/core/models/User";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import { IBaseModel, BaseModel, registerModel } from "@/core/models/Base";
import useProjectColumnCreatedHandlers from "@/controllers/socket/project/column/useProjectColumnCreatedHandlers";
import useProjectColumnNameChangedHandlers from "@/controllers/socket/project/column/useProjectColumnNameChangedHandlers";
import useProjectLabelCreatedHandlers from "@/controllers/socket/project/label/useProjectLabelCreatedHandlers";
import useProjectLabelOrderChangedHandlers from "@/controllers/socket/project/label/useProjectLabelOrderChangedHandlers";
import useProjectLabelDeletedHandlers from "@/controllers/socket/project/label/useProjectLabelDeletedHandlers";
import useProjectAssignedUsersUpdatedHandlers from "@/controllers/socket/board/useProjectAssignedUsersUpdatedHandlers";
import useProjectTitleChangedHandlers from "@/controllers/socket/project/useProjectTitleChangedHandlers";
import useProjectTypeChangedHandlers from "@/controllers/socket/project/useProjectTypeChangedHandlers";
import useProjectColumnOrderChangedHandlers from "@/controllers/socket/project/column/useProjectColumnOrderChangedHandlers";
import useDashboardCardCreatedHandlers from "@/controllers/socket/dashboard/useDashboardCardCreatedHandlers";
import useDashboardCardOrderChangedHandlers from "@/controllers/socket/dashboard/useDashboardCardOrderChangedHandlers";
import useCardRelationshipsUpdatedHandlers from "@/controllers/socket/card/useCardRelationshipsUpdatedHandlers";

export enum ERoleAction {
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    CARD_WRITE = "card_write",
    CARD_UPDATE = "card_update",
    CARD_DELETE = "card_delete",
}
export type TRoleActions = ERoleAction | keyof typeof ERoleAction;

export const TYPES = ["SI", "SW", "Other"];

export interface Interface extends IBaseModel {
    title: string;
    project_type: string;
}

export interface IStore extends Interface {
    starred: bool;
    columns: ProjectColumn.Interface[];
    members: User.Interface[];
    current_user_role_actions: TRoleActions[];
    invited_members: User.Interface[];
    labels: ProjectLabel.Interface[];
    description: string;
    ai_description?: string;
}

class Project extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            columns: ProjectColumn.Model.MODEL_NAME,
            members: User.Model.MODEL_NAME,
            invited_members: User.Model.MODEL_NAME,
            labels: ProjectLabel.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "Project" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
        this.subscribeSocketEvents(
            [
                useDashboardCardCreatedHandlers,
                useDashboardCardOrderChangedHandlers,
                useProjectTitleChangedHandlers,
                useProjectTypeChangedHandlers,
                useProjectColumnCreatedHandlers,
                useProjectColumnNameChangedHandlers,
                useProjectColumnOrderChangedHandlers,
                useProjectAssignedUsersUpdatedHandlers,
                useProjectLabelCreatedHandlers,
                useProjectLabelOrderChangedHandlers,
                useProjectLabelDeletedHandlers,
                useCardRelationshipsUpdatedHandlers,
            ],
            {
                projectUID: this.uid,
            }
        );

        ProjectColumn.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.columns = [...this.columns, ...models] as ProjectColumn.Interface[];
            },
            (model) => model.project_uid === this.uid
        );
        ProjectColumn.Model.subscribe("DELETION", this.uid, (uids) => {
            this.columns = this.columns.filter((column) => !uids.includes(column.uid));
        });
        ProjectLabel.Model.subscribe(
            "CREATION",
            this.uid,
            (models) => {
                this.labels = [...this.labels, ...models] as ProjectLabel.Interface[];
            },
            (model) => model.project_uid === this.uid
        );
        ProjectLabel.Model.subscribe("DELETION", this.uid, (uids) => {
            this.labels = this.labels.filter((label) => !uids.includes(label.uid));
        });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value: string) {
        this.update({ title: value });
    }

    public get project_type() {
        return this.getValue("project_type");
    }
    public set project_type(value: string) {
        this.update({ project_type: value });
    }

    public get starred() {
        return this.getValue("starred");
    }
    public set starred(value: bool) {
        this.update({ starred: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value: string) {
        this.update({ description: value });
    }

    public get ai_description() {
        return this.getValue("ai_description");
    }
    public set ai_description(value: string | undefined) {
        this.update({ ai_description: value });
    }

    public get columns(): ProjectColumn.TModel[] {
        return this.getForeignModels("columns");
    }
    public set columns(value: (ProjectColumn.TModel | ProjectColumn.Interface)[]) {
        this.update({ columns: value });
    }

    public get members(): User.TModel[] {
        return this.getForeignModels("members");
    }
    public set members(value: (User.TModel | User.Interface)[]) {
        this.update({ members: value });
    }

    public get current_user_role_actions() {
        return this.getValue("current_user_role_actions");
    }
    public set current_user_role_actions(value: TRoleActions[]) {
        this.update({ current_user_role_actions: value });
    }

    public get invited_members(): User.TModel[] {
        return this.getForeignModels("invited_members");
    }
    public set invited_members(value: (User.TModel | User.Interface)[]) {
        this.update({ invited_members: value });
    }

    public get labels(): ProjectLabel.TModel[] {
        return this.getForeignModels("labels");
    }
    public set labels(value: (ProjectLabel.TModel | ProjectLabel.Interface)[]) {
        this.update({ labels: value });
    }
}

registerModel(Project);

export type TModel = Project;
export const Model = Project;
