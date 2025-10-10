import { IBaseModel } from "@/core/models/Base";
import {
    IBaseActivity,
    IChangesInActivityHistory,
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
    filterable_map: IBaseActivity<THistory>["filterable_map"] & {
        project: string;
    };
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
export interface IProjectAssignedUsersUpdatedActivity extends IBaseProjectActivity<IProjectActivityHistory & IUpdatedAssignedUsersInActivityHistory> {
    activity_type: EProjectActivityType.ProjectAssignedUsersUpdated;
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
    | IProjectAssignedUsersUpdatedActivity
    | IProjectInvitedUserAcceptedActivity
    | IProjectDeletedActivity;
