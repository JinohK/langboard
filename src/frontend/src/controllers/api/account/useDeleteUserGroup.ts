import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteUserGroup = (group: UserGroup.TModel, options?: TMutationOptions<unknown, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.ACCOUNT.USER_GROUP.DELETE, {
        group_uid: group.uid,
    });

    const { createToastCreator } = useRevert(url, () => {
        UserGroup.Model.addModel(group);
    });

    const deleteUserGroup = async () => {
        const res = await api.delete(url);

        UserGroup.Model.deleteModel(group.uid);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["delete-user-group"], deleteUserGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteUserGroup;
