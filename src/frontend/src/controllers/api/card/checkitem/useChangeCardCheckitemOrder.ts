/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardCheckitemOrderForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    order: number;
    parent_uid?: string;
}

const useChangeCardCheckitemOrder = (options?: TMutationOptions<IChangeCardCheckitemOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemOrder = async (params: IChangeCardCheckitemOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
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

    const result = mutate(["change-card-checkitem-order"], changeCheckitemOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckitemOrder;
