import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCardForm {
    project_uid: string;
    card_uid: string;
}

const useDeleteCard = (options?: TMutationOptions<IDeleteCardForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCard = async (params: IDeleteCardForm) => {
        const url = format(API_ROUTES.BOARD.CARD.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.delete(url);

        return res.data;
    };

    const result = mutate(["delete-card"], deleteCard, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCard;
