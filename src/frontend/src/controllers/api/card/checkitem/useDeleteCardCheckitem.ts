/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCardCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
}

const useDeleteCardCheckitem = (options?: TMutationOptions<IDeleteCardCheckitemForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCheckitem = async (params: IDeleteCardCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-card-checkitem"], deleteCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardCheckitem;
