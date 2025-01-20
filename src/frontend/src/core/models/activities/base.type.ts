/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBaseModel } from "@/core/models/Base";

export interface IBaseActivity<TActivityHistory extends Record<string, any>> extends IBaseModel {
    activity_history: TActivityHistory & { recorder: IBotInActivityHistory | IUserInActivityHistory };
    filterable_type: "project" | "user";
    filterable_uid: string;
    sub_filterable_type?: "card" | "project_wiki";
    sub_filterable_uid?: string;
    refer?: any;
    references?: any;
    created_at: Date;
}

interface IBaseUserInActivityHistory {
    type: "user" | "unknown" | "bot";
    avatar?: string;
}

export interface IBotInActivityHistory extends IBaseUserInActivityHistory {
    type: "bot";
    name: string;
}

export interface IUserInActivityHistory extends IBaseUserInActivityHistory {
    type: "user" | "unknown";
    firstname: string;
    lastname: string;
}

export interface ILabelInActivityHistory {
    name: string;
    color: string;
}

export interface IRelationshipInActivityHistory {
    relationship_name: string;
    related_card_title: string;
}

export interface IChangesInActivityHistory {
    changes: {
        before: Record<string, any>;
        after: Record<string, any>;
    };
}

export interface IUpdatedAssignedBotsInActivityHistory {
    removed_bots: IBotInActivityHistory[];
    added_bots: IBotInActivityHistory[];
}

export interface IUpdatedAssignedUsersInActivityHistory {
    removed_users: IUserInActivityHistory[];
    added_users: IUserInActivityHistory[];
}

export interface IUpdatedAssigneesInActivityHistory extends IUpdatedAssignedBotsInActivityHistory, IUpdatedAssignedUsersInActivityHistory {}

export interface IUpdatedLabelsInActivityHistory {
    removed_labels: IUserInActivityHistory[];
    added_labels: IUserInActivityHistory[];
}

export interface IUpdatedRelationshipsInActivityHistory {
    removed_relationships: IRelationshipInActivityHistory[];
    added_relationships: IRelationshipInActivityHistory[];
}
