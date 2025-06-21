/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteUserGroup = (group: UserGroup.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteUserGroup = async () => {
        const url = format(API_ROUTES.ACCOUNT.USER_GROUP.DELETE, {
            group_uid: group.uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        UserGroup.Model.deleteModel(group.uid);

        return res.data;
    };

    const result = mutate(["delete-user-group"], deleteUserGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteUserGroup;
