import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User, UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateUserGroupAssignedEmailsForm {
    emails: string[];
}

const useUpdateUserGroupAssignedEmails = (group: UserGroup.TModel, options?: TMutationOptions<IUpdateUserGroupAssignedEmailsForm>) => {
    const { mutate } = useQueryMutation();

    const updateUserGroupAssignedEmails = async (params: IUpdateUserGroupAssignedEmailsForm) => {
        const url = format(API_ROUTES.ACCOUNT.USER_GROUP.UPDATE_ASSIGNED_EMAILS, {
            group_uid: group.uid,
        });
        const res = await api.put(url, {
            emails: params.emails,
        });

        User.Model.deleteModels(group.users.filter((emailUser) => !emailUser.isValidUser() && !emailUser.isBot()).map((emailUser) => emailUser.uid));
        group.users = res.data.users;

        return res.data;
    };

    const result = mutate(["update-user-group-assigned-emails"], updateUserGroupAssignedEmails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserGroupAssignedEmails;
