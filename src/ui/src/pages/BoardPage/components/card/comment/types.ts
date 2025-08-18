import { TEditor } from "@/components/Editor/editor-kit";
import { IEditorContent } from "@/core/models/Base";
import { TUserLikeModel } from "@/core/models/ModelRegistry";

export interface IBoardCommentContextParams {
    author: TUserLikeModel;
    deletedComment: (commentUID: string) => void;
    valueRef: React.RefObject<IEditorContent>;
    editorName: string;
    isCurrentEditor: bool;
    editorRef: React.RefObject<TEditor>;
}
