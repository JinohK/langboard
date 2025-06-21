/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateCardLabelsForm {
    project_uid: string;
    card_uid: string;
    labels: string[];
}

const useUpdateCardLabels = (options?: TMutationOptions<IUpdateCardLabelsForm>) => {
    const { mutate } = useQueryMutation();

    const updateCardLabels = async (params: IUpdateCardLabelsForm) => {
        const url = format(API_ROUTES.BOARD.CARD.UPDATE_LABELS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(
            url,
            {
                labels: params.labels,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["update-card-labels"], updateCardLabels, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateCardLabels;
