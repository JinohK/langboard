import { IBoardCard } from "@/controllers/api/board/useGetCards";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface ICardifyCheckitemForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    column_uid?: string;
    with_sub_checkitems?: bool;
    with_assign_users?: bool;
}

export interface ICardifyCheckitemResponse {
    new_card: IBoardCard;
}

const useCardifyCheckitem = (options?: TMutationOptions<ICardifyCheckitemForm, ICardifyCheckitemResponse>) => {
    const { mutate } = useQueryMutation();

    const cardifyCheckitem = async (params: ICardifyCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CARDIFY, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.post(url, {
            column_uid: params.column_uid,
            with_sub_checkitems: params.with_sub_checkitems,
            with_assign_users: params.with_assign_users,
        });

        User.transformFromApi(res.data.new_card.members);

        return res.data;
    };

    const result = mutate(["cardify-checkitem"], cardifyCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCardifyCheckitem;
