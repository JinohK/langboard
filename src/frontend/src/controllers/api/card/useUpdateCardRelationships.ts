/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateCardRelationshipsForm {
    project_uid: string;
    card_uid: string;
    is_parent: bool;
    relationships: [string, string][];
}

const useUpdateCardRelationships = (options?: TMutationOptions<IUpdateCardRelationshipsForm>) => {
    const { mutate } = useQueryMutation();

    const updateCardRelationships = async (params: IUpdateCardRelationshipsForm) => {
        const url = format(API_ROUTES.BOARD.CARD.UPDATE_RELATIONSHIPS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(
            url,
            {
                is_parent: params.is_parent,
                relationships: params.relationships,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["update-card-relationships"], updateCardRelationships, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateCardRelationships;
