/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBaseModel } from "@/core/models/Base";

export interface IBaseActivity<TActivityHistory extends Record<string, any>> extends IBaseModel {
    activity_history: TActivityHistory & { recorder: IBotInActivityHistory | IUserInActivityHistory };
    filterable_map: {
        project?: string;
        user?: string;
        bot?: string;
        project_column?: string;
        card?: string;
        project_wiki?: string;
    };
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

export interface IUpdatedAssignedUsersInActivityHistory {
    removed_users: IUserInActivityHistory[];
    added_users: IUserInActivityHistory[];
}

export interface IUpdatedLabelsInActivityHistory {
    removed_labels: IUserInActivityHistory[];
    added_labels: IUserInActivityHistory[];
}

export interface IUpdatedRelationshipsInActivityHistory {
    removed_relationships: IRelationshipInActivityHistory[];
    added_relationships: IRelationshipInActivityHistory[];
}
