import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardChecklistOrderForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
    order: number;
}

const useChangeCardChecklistOrder = (options?: TMutationOptions<IChangeCardChecklistOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeChecklistOrder = async (params: IChangeCardChecklistOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKLIST.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-card-checklist-order"], changeChecklistOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardChecklistOrder;
