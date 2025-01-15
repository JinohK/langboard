import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IToggleCardCheckGroupCheckedForm {
    project_uid: string;
    card_uid: string;
    check_group_uid: string;
}

const useToggleCardCheckGroupChecked = (options?: TMutationOptions<IToggleCardCheckGroupCheckedForm>) => {
    const { mutate } = useQueryMutation();

    const toggleCheckGroupChecked = async (params: IToggleCardCheckGroupCheckedForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.TOGGLE_CHECKED, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            check_group_uid: params.check_group_uid,
        });
        const res = await api.put(url);

        return res.data;
    };

    const result = mutate(["toggle-card-check-group-checked"], toggleCheckGroupChecked, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleCardCheckGroupChecked;
