import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
}

export interface IDeleteCheckitemResponse {}

const useDeleteCheckitem = (options?: TMutationOptions<IDeleteCheckitemForm, IDeleteCheckitemResponse>) => {
    const { mutate } = useQueryMutation();

    const deleteCheckitem = async (params: IDeleteCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.delete(url);
        return res.data;
    };

    const result = mutate(["delete-checkitem"], deleteCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCheckitem;
