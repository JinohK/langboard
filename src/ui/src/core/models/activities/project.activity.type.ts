import { IBaseModel } from "@/core/models/Base";
import {
    IBaseActivity,
    IChangesInActivityHistory,
    IUpdatedAssignedBotsInActivityHistory,
    IUpdatedAssignedUsersInActivityHistory,
    IUserInActivityHistory,
} from "@/core/models/activities/base.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";

export interface IProjectActivityHistory {
    project: {
        title: string;
        project_type: string;
        is_deleted?: bool;
    };
}

export interface IBaseProjectActivity<THistory extends IProjectActivityHistory> extends IBaseActivity<THistory> {
    filterable_type: "project";
    filterable_uid: string;
    references: {
        project: IBaseModel;
    };
}

export interface IProjectCreatedActivity extends IBaseProjectActivity<IProjectActivityHistory> {
    activity_type: EProjectActivityType.ProjectCreated;
}
export interface IProjectUpdatedActivity extends IBaseProjectActivity<IProjectActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectActivityType.ProjectUpdated;
}
export interface IProjectAssignedBotsUpdatedActivity extends IBaseProjectActivity<IProjectActivityHistory & IUpdatedAssignedBotsInActivityHistory> {
    activity_type: EProjectActivityType.ProjectAssignedBotsUpdated;
}
export interface IProjectAssignedUsersUpdatedActivity extends IBaseProjectActivity<IProjectActivityHistory & IUpdatedAssignedUsersInActivityHistory> {
    activity_type: EProjectActivityType.ProjectAssignedUsersUpdated;
}
export interface IProjectBotActivatedActivity extends IBaseProjectActivity<IProjectActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectActivityType.ProjectBotActivated;
}
export interface IProjectBotDeactivatedActivity extends IBaseProjectActivity<IProjectActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectActivityType.ProjectBotDeactivated;
}
export interface IProjectInvitedUserAcceptedActivity extends IBaseProjectActivity<IProjectActivityHistory & { user: IUserInActivityHistory }> {
    activity_type: EProjectActivityType.ProjectInvitedUserAccepted;
}
export interface IProjectDeletedActivity extends IBaseProjectActivity<IProjectActivityHistory> {
    activity_type: EProjectActivityType.ProjectDeleted;
}

export type TProjectActivityInterface =
    | IProjectCreatedActivity
    | IProjectUpdatedActivity
    | IProjectAssignedBotsUpdatedActivity
    | IProjectAssignedUsersUpdatedActivity
    | IProjectBotActivatedActivity
    | IProjectBotDeactivatedActivity
    | IProjectInvitedUserAcceptedActivity
    | IProjectDeletedActivity;
