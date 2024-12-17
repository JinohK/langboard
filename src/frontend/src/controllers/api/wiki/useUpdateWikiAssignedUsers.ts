import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateWikiAssignedUsersForm {
    project_uid: string;
    wiki_uid: string;
    assigned_users: number[];
}

export interface IUpdateWikiAssignedUsersResponse {}

const useUpdateWikiAssignedUsers = (options?: TMutationOptions<IUpdateWikiAssignedUsersForm, IUpdateWikiAssignedUsersResponse>) => {
    const { mutate } = useQueryMutation();

    const updateWikiAssignedUsers = async (params: IUpdateWikiAssignedUsersForm) => {
        const url = format(API_ROUTES.BOARD.WIKI.UPDATE_ASSIGNED_USERS, {
            uid: params.project_uid,
            wiki_uid: params.wiki_uid,
        });
        const res = await api.put(url, {
            assigned_users: params.assigned_users,
        });

        return res.data;
    };

    const result = mutate(["update-wiki-assigned-users"], updateWikiAssignedUsers, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateWikiAssignedUsers;
