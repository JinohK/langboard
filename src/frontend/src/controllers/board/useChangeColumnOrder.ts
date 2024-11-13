import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeColumnOrderForm {
    project_uid: string;
    column_uid: string;
    order: number;
}

const useChangeColumnOrder = (options?: TMutationOptions<IChangeColumnOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeColumnOrder = async (params: IChangeColumnOrderForm) => {
        const url = format(API_ROUTES.BOARD.CHANGE_COLUMN_ORDER, { uid: params.project_uid, column_uid: params.column_uid });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-column-order"], changeColumnOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeColumnOrder;
