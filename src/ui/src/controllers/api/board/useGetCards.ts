/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { deleteCardModel } from "@/core/helpers/ModelHelper";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectColumn, ProjectCard, GlobalRelationshipType, ProjectChecklist, ProjectColumnBotScope } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IGetCardsForm {
    project_uid: string;
}

export interface IGetCardsResponse {
    isUpdated: true;
}

const useGetCards = (params: IGetCardsForm, options?: TQueryOptions<unknown, IGetCardsResponse>) => {
    const { query } = useQueryMutation();

    const getCards = async () => {
        const url = Utils.String.format(API_ROUTES.BOARD.GET_CARDS, { uid: params.project_uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        ProjectCard.Model.fromArray(res.data.cards);
        GlobalRelationshipType.Model.fromArray(res.data.global_relationships, true);
        ProjectColumn.Model.fromArray(res.data.columns);
        ProjectChecklist.Model.fromArray(res.data.checklists, true);

        ProjectCard.Model.getModels(
            (model) => model.project_uid === params.project_uid && !res.data.cards.some((card: ProjectCard.TModel) => card.uid === model.uid)
        ).forEach((model) => {
            deleteCardModel(model.uid, true);
        });
        ProjectColumn.Model.deleteModels(
            (model) => model.project_uid === params.project_uid && !res.data.columns.some((column: ProjectColumn.TModel) => column.uid === model.uid)
        );

        ProjectColumnBotScope.Model.fromArray(res.data.column_bot_scopes, true);

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
