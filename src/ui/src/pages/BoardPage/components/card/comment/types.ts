import { IEditorContent } from "@/core/models/Base";

export interface IBoardCommentContextParams {
    deletedComment: (commentUID: string) => void;
    valueRef: React.RefObject<IEditorContent>;
    isEditing: bool;
}
