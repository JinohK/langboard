import * as User from "@/core/models/User";
import * as ProjectColumn from "@/core/models/ProjectColumn";
import { IBaseModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    title: string;
    project_type: string;
}

export interface IDashboard extends Interface {
    starred: bool;
    columns: ProjectColumn.IDashboard[];
}

export interface IBoard extends Interface {
    members: User.Interface[];
    current_user_role_actions: TRoleActions[];
    invited_users: User.Interface[];
}

export interface IBoardWithDetails extends IBoard {
    description: string;
    ai_description: string;
}

export type TRoleActions = "read" | "write" | "update" | "delete" | "card_write" | "card_update" | "card_delete";

export enum ERoleAction {
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    CARD_WRITE = "card_write",
    CARD_UPDATE = "card_update",
    CARD_DELETE = "card_delete",
}

export const TYPES = ["SI", "SW", "Other"];

export const ARCHIVE_COLUMN_UID = "archive";
