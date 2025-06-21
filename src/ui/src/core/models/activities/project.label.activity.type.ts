import { IBaseProjectActivity, IProjectActivityHistory } from "@/core/models/activities/project.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IChangesInActivityHistory, ILabelInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectLabelActivityHistory extends IProjectActivityHistory {
    label: ILabelInActivityHistory;
}

export interface IProjectLabelCreatedActivitiy extends IBaseProjectActivity<IProjectLabelActivityHistory> {
    activity_type: EProjectActivityType.ProjectLabelCreated;
}
export interface IProjectLabelUpdatedActivitiy extends IBaseProjectActivity<IProjectLabelActivityHistory & Required<IChangesInActivityHistory>> {
    activity_type: EProjectActivityType.ProjectLabelUpdated;
}
export interface IProjectLabelDeletedActivitiy extends IBaseProjectActivity<IProjectLabelActivityHistory> {
    activity_type: EProjectActivityType.ProjectLabelDeleted;
}

export type TProjectLabelActivityInterface = IProjectLabelCreatedActivitiy | IProjectLabelUpdatedActivitiy | IProjectLabelDeletedActivitiy;
