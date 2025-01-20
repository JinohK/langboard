import { IBaseProjectActivity, IProjectActivityHistory } from "@/core/models/activities/project.activity.type";
import { EProjectActivityType } from "@/core/models/activities/enum.type";
import { IChangesInActivityHistory } from "@/core/models/activities/base.type";

export interface IProjectColumnActivityHistory extends IProjectActivityHistory {
    column: {
        name: string;
    };
}

export interface IProjectColumnCreatedActivitiy extends IBaseProjectActivity<IProjectColumnActivityHistory> {
    activity_type: EProjectActivityType.ProjectColumnCreated;
}
export interface IProjectColumnNameChangedActivitiy extends IBaseProjectActivity<IProjectColumnActivityHistory & IChangesInActivityHistory> {
    activity_type: EProjectActivityType.ProjectColumnNameChanged;
}

export type TProjectColumnActivityInterface = IProjectColumnCreatedActivitiy | IProjectColumnNameChangedActivitiy;
