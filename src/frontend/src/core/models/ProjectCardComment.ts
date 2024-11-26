import { IEditorContent } from "@/core/models/Base";

export interface Interface {
    uid: string;
    content: IEditorContent;
    is_edited: bool;
    commented_at: Date;
}
