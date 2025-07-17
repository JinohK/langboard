import { TCreatedAtModelName } from "@/core/models/ModelRegistry";

type TActivityType = "user" | "project" | "card" | "project_wiki" | "project_assignee";

export interface IBaseGetListForm<TModelName extends TCreatedAtModelName> {
    listType: TModelName;
}

interface IBaseGetActivitiesForm<TActivity extends TActivityType> extends IBaseGetListForm<"ActivityModel"> {
    listType: "ActivityModel";
    type: TActivity;
}

interface IGetUserActivitiesForm extends IBaseGetActivitiesForm<"user"> {
    user_uid: string;
}

interface IGerProjectActivitiesForm extends IBaseGetActivitiesForm<"project"> {
    project_uid: string;
}

interface IGetCardActivitiesForm extends IBaseGetActivitiesForm<"card"> {
    project_uid: string;
    card_uid: string;
}

interface IGetProjectWikiActivitiesForm extends IBaseGetActivitiesForm<"project_wiki"> {
    project_uid: string;
    wiki_uid: string;
}

interface IGetProjectAssigneeActivitiesForm extends IBaseGetActivitiesForm<"project_assignee"> {
    project_uid: string;
    assignee_uid: string;
}

export type TGetActivitiesForm =
    | IGetUserActivitiesForm
    | IGerProjectActivitiesForm
    | IGetCardActivitiesForm
    | IGetProjectWikiActivitiesForm
    | IGetProjectAssigneeActivitiesForm;

export type TGetListForm<TModelName extends TCreatedAtModelName> = TModelName extends "ActivityModel"
    ? IBaseGetActivitiesForm<TActivityType>
    : IBaseGetListForm<TModelName>;
