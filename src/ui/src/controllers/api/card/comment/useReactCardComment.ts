/* eslint-disable @typescript-eslint/no-explicit-any */
import { TReactionEmoji } from "@/components/ReactionCounter";
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IReactCardCommentForm {
    project_uid: string;
    card_uid: string;
    comment_uid: string;
    reaction: TReactionEmoji;
}

const useReactCardComment = (options?: TMutationOptions<IReactCardCommentForm>) => {
    const { mutate } = useQueryMutation();

    const reactCardComment = async (params: IReactCardCommentForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.COMMENT.REACT, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            comment_uid: params.comment_uid,
        });
        const res = await api.post(
            url,
            {
                reaction: params.reaction,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["react-card-comment"], reactCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useReactCardComment;
