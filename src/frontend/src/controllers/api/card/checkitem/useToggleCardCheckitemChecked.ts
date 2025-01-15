import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IToggleCardCheckitemCheckedForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
}

const useToggleCardCheckitemChecked = (options?: TMutationOptions<IToggleCardCheckitemCheckedForm>) => {
    const { mutate } = useQueryMutation();

    const toggleCheckitemChecked = async (params: IToggleCardCheckitemCheckedForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.TOGGLE_CHECKED, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(url);

        return res.data;
    };

    const result = mutate(["toggle-card-checkitem-checked"], toggleCheckitemChecked, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleCardCheckitemChecked;
