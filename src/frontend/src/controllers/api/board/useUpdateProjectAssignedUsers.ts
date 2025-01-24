import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectAssignedUsersForm {
    uid: string;
    emails: string[];
}

const useUpdateProjectAssignedUsers = (options?: TMutationOptions<IUpdateProjectAssignedUsersForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectAssignedUsers = async (params: IUpdateProjectAssignedUsersForm) => {
        const url = format(API_ROUTES.BOARD.UPDATE_ASSIGNED_USERS, {
            uid: params.uid,
        });
        const res = await api.put(url, {
            ...params,
        });

        return res.data;
    };

    const result = mutate(["update-project-assigned-users"], updateProjectAssignedUsers, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectAssignedUsers;
