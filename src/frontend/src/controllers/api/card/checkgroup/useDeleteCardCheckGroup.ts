import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCardCheckGroupForm {
    project_uid: string;
    card_uid: string;
    check_group_uid: string;
}

const useDeleteCardCheckGroup = (options?: TMutationOptions<IDeleteCardCheckGroupForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCheckGroup = async (params: IDeleteCardCheckGroupForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECK_GROUP.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            check_group_uid: params.check_group_uid,
        });
        const res = await api.delete(url);

        return res.data;
    };

    const result = mutate(["delete-card-check-group"], deleteCheckGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardCheckGroup;
