import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardComment } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardCommentsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardCommentsResponse {
    comments: ProjectCardComment.TModel[];
}

const useGetCardComments = (params: IGetCardCommentsForm, options?: TQueryOptions<unknown, IGetCardCommentsResponse>) => {
    const { query } = useQueryMutation();

    const getCardComments = async () => {
        const url = format(API_ROUTES.BOARD.CARD.COMMENT.GET_LIST, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        const comments = ProjectCardComment.Model.fromObjectArray(res.data.comments);

        ProjectCardComment.Model.deleteModels(
            (model) => model.card_uid === params.card_uid && !comments.some((comment: ProjectCardComment.TModel) => comment.uid === model.uid)
        );

        return {
            comments: ProjectCardComment.Model.fromObjectArray(res.data.comments),
        };
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
