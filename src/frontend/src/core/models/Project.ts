import * as BotModel from "@/core/models/BotModel";
import * as User from "@/core/models/User";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import * as ProjectLabel from "@/core/models/ProjectLabel";
import { IBaseModel, BaseModel, registerModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";
import useBoardLabelCreatedHandlers from "@/controllers/socket/board/label/useBoardLabelCreatedHandlers";
import useBoardLabelOrderChangedHandlers from "@/controllers/socket/board/label/useBoardLabelOrderChangedHandlers";
import useBoardLabelDeletedHandlers from "@/controllers/socket/board/label/useBoardLabelDeletedHandlers";
import useBoardAssignedUsersUpdatedHandlers from "@/controllers/socket/board/useBoardAssignedUsersUpdatedHandlers";
import useDashboardProjectCardCreatedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectCardCreatedHandlers";
import useDashboardProjectCardOrderChangedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectCardOrderChangedHandlers";
import useCardRelationshipsUpdatedHandlers from "@/controllers/socket/card/useCardRelationshipsUpdatedHandlers";
import useBoardDetailsChangedHandlers from "@/controllers/socket/board/useBoardDetailsChangedHandlers";
import useDashboardProjectColumnCreatedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectColumnCreatedHandlers";
import useDashboardProjectColumnNameChangedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectColumnNameChangedHandlers";
import useDashboardProjectColumnOrderChangedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectColumnOrderChangedHandlers";
import useBoardColumnCreatedHandlers from "@/controllers/socket/board/column/useBoardColumnCreatedHandlers";
import useBoardColumnNameChangedHandlers from "@/controllers/socket/board/column/useBoardColumnNameChangedHandlers";
import useBoardColumnOrderChangedHandlers from "@/controllers/socket/board/column/useBoardColumnOrderChangedHandlers";
import useDashboardProjectAssignedUsersUpdatedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectAssignedUsersUpdatedHandlers";
import useBoardAssignedBotsUpdatedHandlers from "@/controllers/socket/board/useBoardAssignedBotsUpdatedHandlers";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useProjectDeletedHandlers from "@/controllers/socket/shared/useProjectDeletedHandlers";
import useDashboardProjectCardDeletedHandlers from "@/controllers/socket/dashboard/project/useDashboardProjectCardDeletedHandlers";

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
    updated_at: Date;
}

export interface IStore extends Interface {
    starred: bool;
    owner: User.Interface;
    columns: ProjectColumn.Interface[];
    members: User.Interface[];
    bots: BotModel.Interface[];
    current_user_role_actions: TRoleActions[];
    invited_members: User.Interface[];
    labels: ProjectLabel.Interface[];
    description: string;
    ai_description?: string;
    last_viewed_at: Date;
}

class Project extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            owner: User.Model.MODEL_NAME,
            columns: ProjectColumn.Model.MODEL_NAME,
            members: User.Model.MODEL_NAME,
            bots: BotModel.Model.MODEL_NAME,
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
                useBoardColumnCreatedHandlers,
                useBoardColumnNameChangedHandlers,
                useBoardColumnOrderChangedHandlers,
                useBoardDetailsChangedHandlers,
                useBoardAssignedBotsUpdatedHandlers,
                useBoardAssignedUsersUpdatedHandlers,
                useBoardLabelCreatedHandlers,
                useBoardLabelOrderChangedHandlers,
                useBoardLabelDeletedHandlers,
                useCardRelationshipsUpdatedHandlers,
            ],
            {
                topic: ESocketTopic.Board,
                projectUID: this.uid,
                project: this,
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

    public static convertModel(model: IStore): Interface {
        if (TypeUtils.isString(model.updated_at)) {
            model.updated_at = new Date(model.updated_at);
        }
        if (TypeUtils.isString(model.last_viewed_at)) {
            model.last_viewed_at = new Date(model.last_viewed_at);
        }
        return model;
    }

    public subscribeDashboardSocketHandlers(userUID: string) {
        return this.subscribeSocketEvents(
            [
                useDashboardProjectAssignedUsersUpdatedHandlers,
                useDashboardProjectCardCreatedHandlers,
                useDashboardProjectCardOrderChangedHandlers,
                useDashboardProjectCardDeletedHandlers,
                useDashboardProjectColumnCreatedHandlers,
                useDashboardProjectColumnNameChangedHandlers,
                useDashboardProjectColumnOrderChangedHandlers,
                useProjectDeletedHandlers,
            ],
            {
                topic: ESocketTopic.Dashboard,
                projectUID: this.uid,
                userUID,
            }
        );
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

    public get owner(): User.TModel {
        return this.getForeignModels<User.TModel>("owner")[0];
    }
    public set owner(value: User.TModel | User.Interface) {
        this.update({ owner: value });
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

    public get bots(): BotModel.TModel[] {
        return this.getForeignModels("bots");
    }
    public set bots(value: (BotModel.TModel | BotModel.Interface)[]) {
        this.update({ bots: value });
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

    public get updated_at(): Date {
        return this.getValue("updated_at");
    }
    public set updated_at(value: string | Date) {
        this.update({ updated_at: value });
    }

    public get last_viewed_at(): Date {
        return this.getValue("last_viewed_at");
    }
    public set last_viewed_at(value: string | Date) {
        this.update({ last_viewed_at: value });
    }
}

registerModel(Project);

export type TModel = Project;
export const Model = Project;
