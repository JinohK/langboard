import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType, Project, ProjectCard } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardDetailsForm {
    project_uid: string;
    card_uid: string;
}

export interface IGetCardDetailsResponse {
    card: ProjectCard.TModel;
    global_relationships: GlobalRelationshipType.TModel[];
    current_user_role_actions: Project.TRoleActions[];
}

const useGetCardDetails = (params: IGetCardDetailsForm, options?: TQueryOptions<unknown, IGetCardDetailsResponse>) => {
    const { query } = useQueryMutation();

    const getCardDetails = async () => {
        const url = format(API_ROUTES.BOARD.CARD.GET_DETAILS, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.get(url);

        return {
            card: ProjectCard.Model.fromObject(res.data.card),
            global_relationships: GlobalRelationshipType.Model.fromObjectArray(res.data.global_relationships, true),
            current_user_role_actions: res.data.current_user_role_actions,
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
