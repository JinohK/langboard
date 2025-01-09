import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { UserGroup } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IChangeUserGroupNameForm {
    name: string;
}

const useChangeUserGroupName = (group: UserGroup.TModel, options?: TMutationOptions<IChangeUserGroupNameForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.ACCOUNT.USER_GROUP.CHANGE_NAME, {
        group_uid: group.uid,
    });

    const { createToastCreator } = useRevert<string>(url, (lastGroupName) => {
        group.name = lastGroupName;
    });

    const changeUserGroupName = async (params: IChangeUserGroupNameForm) => {
        const lastGroupName = group.name;

        const res = await api.put(url, {
            name: params.name,
        });

        group.name = params.name;

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, lastGroupName),
        };
    };

    const result = mutate(["change-user-group-name"], changeUserGroupName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeUserGroupName;
