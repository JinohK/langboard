import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCardChecklistForm {
    project_uid: string;
    card_uid: string;
    title: string;
}

const useCreateCardChecklist = (options?: TMutationOptions<ICreateCardChecklistForm>) => {
    const { mutate } = useQueryMutation();

    const createChecklist = async (params: ICreateCardChecklistForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKLIST.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.post(url, {
            title: params.title,
        });

        return res.data;
    };

    const result = mutate(["create-card-checklist"], createChecklist, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCardChecklist;
