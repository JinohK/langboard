/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardOrderForm {
    project_uid: string;
    card_uid: string;
    parent_uid?: string;
    order: number;
}

const useChangeCardOrder = (options?: TMutationOptions<IChangeCardOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeCardOrder = async (params: IChangeCardOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHANGE_ORDER, { uid: params.project_uid, card_uid: params.card_uid });
        const res = await api.put(
            url,
            {
                parent_uid: params.parent_uid,
                order: params.order,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["change-card-order"], changeCardOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardOrder;
