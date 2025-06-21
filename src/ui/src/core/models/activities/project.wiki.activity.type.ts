import { IBaseModel } from "@/core/models/Base";
import { IBaseProjectActivity, IProjectActivityHistory } from "@/core/models/activities/project.activity.type";
import { EProjectWikiActivityType } from "@/core/models/activities/enum.type";
import { IBaseActivity, IChangesInActivityHistory, IUpdatedAssigneesInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectWikiActivityHistory extends IProjectActivityHistory {
    wiki: {
        title: string;
        is_deleted?: bool;
    };
}

export interface IBaseProjectCardActivity<THistory extends IProjectWikiActivityHistory> extends IBaseProjectActivity<THistory> {
    filterable_type: "project";
    filterable_uid: string;
    sub_filterable_type: "project_wiki";
    sub_filterable_uid: string;
    references: {
        project: IBaseModel;
        project_wiki: IBaseModel;
    };
}

export interface IProjectWikiCreatedActivitiy extends IBaseActivity<IProjectWikiActivityHistory> {
    activity_type: EProjectWikiActivityType.WikiCreated;
}
export interface IProjectWikiUpdatedActivitiy extends IBaseActivity<IProjectWikiActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectWikiActivityType.WikiUpdated;
}
export interface IProjectWikiPublicityChangedActivitiy extends IBaseActivity<IProjectWikiActivityHistory & { was_public: bool; is_public: bool }> {
    activity_type: EProjectWikiActivityType.WikiPublicityChanged;
}
export interface IProjectWikiAssigneesUpdatedActivitiy extends IBaseActivity<IProjectWikiActivityHistory & IUpdatedAssigneesInActivityHistory> {
    activity_type: EProjectWikiActivityType.WikiAssigneesUpdated;
}
export interface IProjectWikiDeletedActivitiy extends IBaseActivity<IProjectWikiActivityHistory> {
    activity_type: EProjectWikiActivityType.WikiDeleted;
}

export type TProjectWikiActivityInterface =
    | IProjectWikiCreatedActivitiy
    | IProjectWikiUpdatedActivitiy
    | IProjectWikiPublicityChangedActivitiy
    | IProjectWikiAssigneesUpdatedActivitiy
    | IProjectWikiDeletedActivitiy;
