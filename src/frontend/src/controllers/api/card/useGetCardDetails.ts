import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType, ProjectCard, ProjectColumn, ProjectLabel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardDetailsResponse {
    card: ProjectCard.TModel;
    global_relationships: GlobalRelationshipType.TModel[];
    project_columns: ProjectColumn.TModel[];
    project_labels: ProjectLabel.TModel[];
}

const useGetCardDetails = (params: IGetCardDetailsForm, options?: TQueryOptions<unknown, IGetCardDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getCardDetails = async () => {
        const url = format(API_ROUTES.BOARD.CARD.GET_DETAILS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        return {
            card: ProjectCard.Model.fromObject(res.data.card),
            global_relationships: GlobalRelationshipType.Model.fromObjectArray(res.data.global_relationships, true),
            project_columns: ProjectColumn.Model.fromObjectArray(res.data.project_columns, true),
            project_labels: ProjectLabel.Model.fromObjectArray(res.data.project_labels, true),
        };
    };

    const result = query([`get-card-details-${params.card_uid}`], getCardDetails, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetCardDetails;
