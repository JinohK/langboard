import * as User from "@/core/models/User";
import { IEditorContent } from "@/core/models/Base";

export interface Interface {
    uid: string;
    title: string;
    content: IEditorContent;
    order: number;
    is_public: bool;
    forbidden?: true;
    assigned_members: User.Interface[];
}
