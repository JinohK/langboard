import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { IEditorContent } from "@/core/models/Base";
import { format } from "@/core/utils/StringUtils";

export interface IAddCardCommentForm {
    project_uid: string;
    card_uid: string;
    content: IEditorContent;
}

const useAddCardComment = (options?: TMutationOptions<IAddCardCommentForm>) => {
    const { mutate } = useQueryMutation();

    const addCardComment = async (params: IAddCardCommentForm) => {
        const url = format(API_ROUTES.BOARD.CARD.COMMENT.ADD, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.post(url, {
            ...params.content,
        });

        return res.data;
    };

    const result = mutate(["add-card-comment"], addCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useAddCardComment;
