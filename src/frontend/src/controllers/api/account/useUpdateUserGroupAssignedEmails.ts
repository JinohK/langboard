import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateUserGroupAssignedEmailsForm {
    emails: string[];
}

export interface IUpdateUserGroupAssignedEmailsResponse extends IRevertKeyBaseResponse {
    users: User.TModel[];
}

const useUpdateUserGroupAssignedEmails = (
    groupUID: string,
    revertCallback?: () => void,
    options?: TMutationOptions<IUpdateUserGroupAssignedEmailsForm, IUpdateUserGroupAssignedEmailsResponse>
) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.ACCOUNT.USER_GROUP.UPDATE_ASSIGNED_EMAILS, {
        group_uid: groupUID,
    });

    const { revert, createToastButton: createRevertToastButton } = useRevert(url, revertCallback);

    const updateUserGroupAssignedEmails = async (params: IUpdateUserGroupAssignedEmailsForm) => {
        const res = await api.put(url, {
            emails: params.emails,
        });

        return res.data;
    };

    const result = mutate(["update-user-group-assigned-emails"], updateUserGroupAssignedEmails, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useUpdateUserGroupAssignedEmails;
