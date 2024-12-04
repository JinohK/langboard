import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectColumn, ProjectCard, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardsForm {
    project_uid: string;
}

export interface IBoardCard extends ProjectCard.Interface {
    count_comment: number;
    members: User.Interface[];
    relationships: {
        parents: string[];
        children: string[];
    };
}

export interface IGetCardsResponse {
    cards: IBoardCard[];
    columns: ProjectColumn.Interface[];
}

const useGetCards = (params: IGetCardsForm, options?: TQueryOptions<IGetCardsForm, IGetCardsResponse>) => {
    const { query } = useQueryMutation();

    const getCards = async () => {
        const url = format(API_ROUTES.BOARD.GET_CARDS, { uid: params.project_uid });
        const res = await api.get(url);

        for (let i = 0; i < res.data.cards.length; ++i) {
            User.transformFromApi(res.data.cards[i].members);
        }

        return res.data;
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
