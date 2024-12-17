import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ROUTES } from "@/core/routing/constants";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectAssignedUsersForm {
    uid: string;
    emails: string[];
    lang?: string;
}

export interface IUpdateProjectAssignedUsersResponse {}

export const PROJCT_INVITATION_TOKEN_QUERY_NAME = "PikQ";

const useUpdateProjectAssignedUsers = (options?: TMutationOptions<IUpdateProjectAssignedUsersForm, IUpdateProjectAssignedUsersResponse>) => {
    const { mutate } = useQueryMutation();

    const updateProjectAssignedUsers = async (params: IUpdateProjectAssignedUsersForm) => {
        const url = format(API_ROUTES.BOARD.UPDATE_ASSIGNED_USERS, {
            uid: params.uid,
        });
        const res = await api.put(url, {
            ...params,
            url: `${window.location.origin}${ROUTES.BOARD.INVITATION}`,
            token_query_name: PROJCT_INVITATION_TOKEN_QUERY_NAME,
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
