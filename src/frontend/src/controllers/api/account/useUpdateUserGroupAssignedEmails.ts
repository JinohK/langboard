import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { User, UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateUserGroupAssignedEmailsForm {
    emails: string[];
}

const useUpdateUserGroupAssignedEmails = (
    group: UserGroup.TModel,
    revertCallback: (originalUsers: User.TModel[]) => void,
    options?: TMutationOptions<IUpdateUserGroupAssignedEmailsForm, IRevertKeyBaseResponse>
) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.ACCOUNT.USER_GROUP.UPDATE_ASSIGNED_EMAILS, {
        group_uid: group.uid,
    });

    const { createToastCreator } = useRevert<[User.TModel[], User.TModel[]]>(url, ([originalUsers, updatedUsers]) => {
        User.Model.deleteModels(updatedUsers.filter((emailUser) => !emailUser.isValidUser()).map((emailUser) => emailUser.uid));
        group.users = originalUsers;
        revertCallback(originalUsers);
    });

    const updateUserGroupAssignedEmails = async (params: IUpdateUserGroupAssignedEmailsForm) => {
        const res = await api.put(url, {
            emails: params.emails,
        });

        const originalUsers = [...group.users];

        User.Model.deleteModels(group.users.filter((emailUser) => !emailUser.isValidUser()).map((emailUser) => emailUser.uid));
        group.users = res.data.users;

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, [originalUsers, group.users]),
        };
    };

    const result = mutate(["update-user-group-assigned-emails"], updateUserGroupAssignedEmails, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserGroupAssignedEmails;
