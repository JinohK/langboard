import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCheckitemOrderForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    order: number;
}

export interface IChangeCheckitemOrderResponse {}

const useChangeCheckitemOrder = (options?: TMutationOptions<IChangeCheckitemOrderForm, IChangeCheckitemOrderResponse>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemOrder = async (params: IChangeCheckitemOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-checkitem-order"], changeCheckitemOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCheckitemOrder;
