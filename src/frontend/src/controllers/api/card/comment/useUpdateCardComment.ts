import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { IEditorContent } from "@/core/models/Base";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateCardCommentForm {
    project_uid: string;
    card_uid: string;
    comment_uid: string;
    content: IEditorContent;
}

export interface IUpdateCardCommentResponse {
    commented_at: Date;
}

const useUpdateCardComment = (options?: TMutationOptions<IUpdateCardCommentForm, IUpdateCardCommentResponse>) => {
    const { mutate } = useQueryMutation();

    const updateCardComment = async (params: IUpdateCardCommentForm) => {
        const url = format(API_ROUTES.BOARD.CARD.COMMENT.UPDATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            comment_uid: params.comment_uid,
        });
        const res = await api.put(url, {
            ...params.content,
        });

        res.data.commented_at = new Date(res.data.commented_at);

        return res.data;
    };

    const result = mutate(["update-card-comment"], updateCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateCardComment;
