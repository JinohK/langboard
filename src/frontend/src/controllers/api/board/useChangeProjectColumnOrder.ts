import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeProjectColumnOrderForm {
    project_uid: string;
    column_uid: string;
    order: number;
}

export interface IChangeProjectColumnOrderResponse extends IModelIdBase {}

const useChangeProjectColumnOrder = (options?: TMutationOptions<IChangeProjectColumnOrderForm, IChangeProjectColumnOrderResponse>) => {
    const { mutate } = useQueryMutation();

    const changeProjectColumnOrder = async (params: IChangeProjectColumnOrderForm) => {
        const url = format(API_ROUTES.BOARD.CHANGE_COLUMN_ORDER, { uid: params.project_uid, column_uid: params.column_uid });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-project-column-order"], changeProjectColumnOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectColumnOrder;
