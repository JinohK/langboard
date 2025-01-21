/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBaseModel } from "@/core/models/Base";
import { EUserActivityType } from "@/core/models/activities/enum.type";
import { IBaseActivity } from "@/core/models/activities/base.type";
import { TProjectRelatedActivityInterface } from "@/core/models/activities/merged.type";
import { TProjectWikiActivityInterface } from "@/core/models/activities/project.wiki.activity.type";

interface IBaseReferredActivity extends IBaseUserActivity<{}> {
    refer: IBaseActivity<any>;
    references: {
        refer_type: "project" | "project_wiki";
    };
}

export interface IProjectReferredActivity extends IBaseReferredActivity {
    refer: TProjectRelatedActivityInterface;
    references: {
        refer_type: "project";
        project: IBaseModel;
        card?: IBaseModel;
    };
}

export interface IProjectWikiReferredActivity extends IBaseReferredActivity {
    refer: TProjectWikiActivityInterface;
    references: {
        refer_type: "project_wiki";
        project: IBaseModel;
        project_wiki: IBaseModel;
    };
}

export type TReferredActivity = IProjectReferredActivity | IProjectWikiReferredActivity;

export interface IBaseUserActivity<THistory extends Record<string, any>> extends IBaseActivity<THistory> {
    filterable_type: "user";
    filterable_uid: string;
    sub_filterable_type?: never;
    sub_filterable_uid?: never;
}

export interface IUserActivatedActivity extends IBaseUserActivity<{ activated_at: Date }> {
    activity_type: EUserActivityType.Activated;
}
export interface IUserDeclinedProjectInvitationActivity extends IBaseUserActivity<{ project_title: string }> {
    activity_type: EUserActivityType.DeclinedProjectInvitation;
}
export interface IUserReferredProjectActivity extends IProjectReferredActivity {
    activity_type?: never;
}
export interface IUserReferredProjectWikiActivity extends IProjectWikiReferredActivity {
    activity_type?: never;
}

export type TUserActivityInterface =
    | IUserActivatedActivity
    | IUserDeclinedProjectInvitationActivity
    | IUserReferredProjectActivity
    | IUserReferredProjectWikiActivity;
