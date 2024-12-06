import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardComment, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardCommentsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardCommentsResponse {
    comments: ProjectCardComment.IBoard[];
}

const useGetCardComments = (params: IGetCardCommentsForm, options?: TQueryOptions<IGetCardCommentsForm, IGetCardCommentsResponse>) => {
    const { query } = useQueryMutation();

    const getCardComments = async () => {
        const url = format(API_ROUTES.BOARD.CARD.COMMENT.GET_LIST, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        for (let i = 0; i < res.data.comments.length; ++i) {
            const comment = res.data.comments[i];
            User.transformFromApi(comment.user);
            ProjectCardComment.transformFromApi(comment);
        }

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
