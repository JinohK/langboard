import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IToggleCardChecklistCheckedForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
}

const useToggleCardChecklistChecked = (options?: TMutationOptions<IToggleCardChecklistCheckedForm>) => {
    const { mutate } = useQueryMutation();

    const toggleChecklistChecked = async (params: IToggleCardChecklistCheckedForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKLIST.TOGGLE_CHECKED, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.put(url);

        return res.data;
    };

    const result = mutate(["toggle-card-checklist-checked"], toggleChecklistChecked, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleCardChecklistChecked;
