import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateCardAssignedUsersForm {
    project_uid: string;
    card_uid: string;
    assigned_users: string[];
}

export interface IUpdateCardAssignedUsersResponse {}

const useUpdateCardAssignedUsers = (options?: TMutationOptions<IUpdateCardAssignedUsersForm, IUpdateCardAssignedUsersResponse>) => {
    const { mutate } = useQueryMutation();

    const updateCardAssignedUsers = async (params: IUpdateCardAssignedUsersForm) => {
        const url = format(API_ROUTES.BOARD.CARD.UPDATE_ASSIGNED_USERS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(url, {
            assigned_users: params.assigned_users,
        });

        return res.data;
    };

    const result = mutate(["update-card-assigned-users"], updateCardAssignedUsers, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateCardAssignedUsers;
