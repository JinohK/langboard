import * as User from "@/core/models/User";

export interface Interface {
    uid: string;
    title: string;
    project_type: string;
}

export interface IBoard extends Interface {
    members: User.Interface[];
    current_user_role_actions: TRoleActions[];
    invited_users: User.Interface[];
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
