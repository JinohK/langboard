import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeTaskOrderForm {
    project_uid: string;
    task_uid: string;
    column_uid?: string;
    order: number;
}

const useChangeTaskOrder = (options?: TMutationOptions<IChangeTaskOrderForm>) => {
    const { mutate } = useQueryMutation();

    const changeTaskOrder = async (params: IChangeTaskOrderForm) => {
        const url = format(API_ROUTES.BOARD.CHANGE_TASK_ORDER, { uid: params.project_uid, task_uid: params.task_uid });
        const res = await api.put(url, {
            column_uid: params.column_uid,
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-task-order"], changeTaskOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeTaskOrder;
