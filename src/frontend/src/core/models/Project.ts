export interface Interface {
    uid: string;
    title: string;
    project_type: string;
}

export type TProjectRoleActions = "read" | "write" | "update" | "delete" | "task_write" | "task_update" | "task_delete";

export const TYPES = ["SI", "SW"];
