export interface Interface {
    uid: string;
    title: string;
    project_type: string;
}

export type TRoleActions = "read" | "write" | "update" | "delete" | "card_write" | "card_update" | "card_delete";

export enum ERoleAction {
    READ = "read",
    WRITE = "write",
    UPDATE = "update",
    DELETE = "delete",
    CARD_WRITE = "card_write",
    CARD_UPDATE = "card_update",
    CARD_DELETE = "card_delete",
}

export const TYPES = ["SI", "SW"];
