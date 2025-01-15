import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCardCheckGroupForm {
    project_uid: string;
    card_uid: string;
    title: string;
}

const useCreateCardCheckGroup = (options?: TMutationOptions<ICreateCardCheckGroupForm>) => {
    const { mutate } = useQueryMutation();

    const createCheckGroup = async (params: ICreateCardCheckGroupForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.post(url, {
            title: params.title,
        });

        return res.data;
    };

    const result = mutate(["create-card-check-group"], createCheckGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCardCheckGroup;
