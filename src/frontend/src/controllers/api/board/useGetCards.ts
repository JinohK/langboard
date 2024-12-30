import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectColumn, ProjectCard } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardsForm {
    project_uid: string;
}

export interface IGetCardsResponse {
    isUpdated: true;
}

const useGetCards = (params: IGetCardsForm, options?: TQueryOptions<unknown, IGetCardsResponse>) => {
    const { query } = useQueryMutation();

    const getCards = async () => {
        const url = format(API_ROUTES.BOARD.GET_CARDS, { uid: params.project_uid });
        const res = await api.get(url);

        ProjectCard.Model.fromObjectArray(res.data.cards);
        ProjectColumn.Model.fromObjectArray(res.data.columns);

        return { isUpdated: true };
    };

    const result = query([`get-cards-${params.project_uid}`], getCards, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetCards;
