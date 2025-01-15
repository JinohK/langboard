import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardCheckGroupTitleForm {
    project_uid: string;
    card_uid: string;
    check_group_uid: string;
    title: string;
}

const useChangeCardCheckGroupTitle = (options?: TMutationOptions<IChangeCardCheckGroupTitleForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckGroupTitle = async (params: IChangeCardCheckGroupTitleForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.CHANGE_TITLE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            check_group_uid: params.check_group_uid,
        });
        const res = await api.put(url, {
            title: params.title,
        });

        return res.data;
    };

    const result = mutate(["change-card-check-group-title"], changeCheckGroupTitle, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckGroupTitle;
