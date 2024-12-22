import * as User from "@/core/models/User";
import { IBaseModel, IEditorContent } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    title: string;
    content: IEditorContent;
    order: number;
    is_public: bool;
    forbidden?: true;
    assigned_members: User.Interface[];
}
