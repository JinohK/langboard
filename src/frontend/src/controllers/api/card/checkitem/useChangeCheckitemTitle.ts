import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCheckitemTitleForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    title: string;
}

export interface IChangeCheckitemTitleResponse {}

const useChangeCheckitemTitle = (options?: TMutationOptions<IChangeCheckitemTitleForm, IChangeCheckitemTitleResponse>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemTitle = async (params: IChangeCheckitemTitleForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CHANGE_TITLE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(url, {
            title: params.title,
        });

        return res.data;
    };

    const result = mutate(["change-checkitem-title"], changeCheckitemTitle, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCheckitemTitle;
