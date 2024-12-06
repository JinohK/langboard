import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IReactCardCommentForm {
    project_uid: string;
    card_uid: string;
    comment_uid: string;
    reaction: TEmoji;
}

export interface IReactCardCommentResponse extends IModelIdBase {
    is_reacted: bool;
}

const useReactCardComment = (options?: TMutationOptions<IReactCardCommentForm, IReactCardCommentResponse>) => {
    const { mutate } = useQueryMutation();

    const reactCardComment = async (params: IReactCardCommentForm) => {
        const url = format(API_ROUTES.BOARD.CARD.COMMENT.REACT, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            comment_uid: params.comment_uid,
        });
        const res = await api.post(url, {
            reaction: params.reaction,
        });

        return res.data;
    };

    const result = mutate(["react-card-comment"], reactCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useReactCardComment;
