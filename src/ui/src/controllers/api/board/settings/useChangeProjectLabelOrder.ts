/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeProjectLabelOrderForm {
    project_uid: string;
    label_uid: string;
    order: number;
}

export interface IChangeProjectLabelOrderResponse {}

const useChangeProjectLabelOrder = (options?: TMutationOptions<IChangeProjectLabelOrderForm, IChangeProjectLabelOrderResponse>) => {
    const { mutate } = useQueryMutation();

    const changeProjectLabelOrder = async (params: IChangeProjectLabelOrderForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.LABEL.CHANGE_ORDER, {
            uid: params.project_uid,
            label_uid: params.label_uid,
        });
        const res = await api.put(
            url,
            {
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

    const result = mutate(["change-project-label-order"], changeProjectLabelOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectLabelOrder;
