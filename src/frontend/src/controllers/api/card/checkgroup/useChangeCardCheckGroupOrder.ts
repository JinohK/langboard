import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardCheckGroupOrderForm {
    project_uid: string;
    card_uid: string;
    check_group_uid: string;
    order: number;
}

const useChangeCardCheckGroupOrder = (options?: TMutationOptions<IChangeCardCheckGroupOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckGroupOrder = async (params: IChangeCardCheckGroupOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            check_group_uid: params.check_group_uid,
        });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-card-check-group-order"], changeCheckGroupOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckGroupOrder;
