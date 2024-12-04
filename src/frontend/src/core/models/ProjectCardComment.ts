import { IEditorContent } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface {
    uid: string;
    content: IEditorContent;
    is_edited: bool;
    commented_at: Date;
}

export const transformFromApi = <TComment extends Interface | Interface[]>(
    comments: TComment
): TComment extends Interface ? Interface : Interface[] => {
    if (!TypeUtils.isArray(comments)) {
        comments.commented_at = new Date(comments.commented_at);
        return comments as unknown as TComment extends Interface ? Interface : Interface[];
    }

    for (let i = 0; i < comments.length; ++i) {
        comments[i].commented_at = new Date(comments[i].commented_at);
    }

    return comments as unknown as TComment extends Interface ? Interface : Interface[];
};
