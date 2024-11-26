import { IEditorContent } from "@/core/models/Base";

export interface Interface {
    uid: string;
    column_uid: string;
    title: string;
    description?: IEditorContent;
    order: number;
}
