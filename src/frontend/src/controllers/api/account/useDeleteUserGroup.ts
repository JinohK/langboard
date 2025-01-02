import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteUserGroupResponse extends IRevertKeyBaseResponse {
    user_group: UserGroup.TModel;
}

const useDeleteUserGroup = (groupUID: string, revertCallback?: () => void, options?: TMutationOptions<unknown, IDeleteUserGroupResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.ACCOUNT.USER_GROUP.DELETE, {
        group_uid: groupUID,
    });

    const { revert, createToastButton: createRevertToastButton } = useRevert(url, revertCallback);

    const deleteUserGroup = async () => {
        const res = await api.delete(url);

        return res.data;
    };

    const result = mutate(["delete-user-group"], deleteUserGroup, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useDeleteUserGroup;
