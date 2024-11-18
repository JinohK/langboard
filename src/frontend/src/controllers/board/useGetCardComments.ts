import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardComment, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardCommentsForm {
    project_uid: string;
    card_uid: string;
}

export interface IBoardCardComment extends ProjectCardComment.Interface {
    user: User.Interface;
    reactions: Partial<Record<TEmoji, number[]>>;
}

export interface IGetCardCommentsResponse {
    comments: IBoardCardComment[];
}

const useGetCardComments = (params: IGetCardCommentsForm, options?: TQueryOptions<IGetCardCommentsForm, IGetCardCommentsResponse>) => {
    const { query } = useQueryMutation();

    const getCardComments = async () => {
        const url = format(API_ROUTES.BOARD.CARD.GET_COMMENTS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        res.data.comments.forEach((comment: IBoardCardComment) => {
            comment.commented_at = new Date(comment.commented_at);
        });

        return res.data;
    };

    const result = query([`get-card-comments-${params.card_uid}`], getCardComments, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetCardComments;
