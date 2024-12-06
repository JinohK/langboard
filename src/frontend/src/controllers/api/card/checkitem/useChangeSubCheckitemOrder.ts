import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeSubCheckitemOrderForm {
    project_uid: string;
    card_uid: string;
    sub_checkitem_uid: string;
    parent_uid?: string;
    order: number;
}

export interface IChangeSubCheckitemOrderResponse extends IModelIdBase {}

const useChangeSubCheckitemOrder = (options?: TMutationOptions<IChangeSubCheckitemOrderForm, IChangeSubCheckitemOrderResponse>) => {
    const { mutate } = useQueryMutation();

    const changeSubCheckitemOrder = async (params: IChangeSubCheckitemOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.SUB_CHECKITEM.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            sub_checkitem_uid: params.sub_checkitem_uid,
        });
        const res = await api.put(url, {
            parent_uid: params.parent_uid,
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-sub-checkitem-order"], changeSubCheckitemOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeSubCheckitemOrder;
