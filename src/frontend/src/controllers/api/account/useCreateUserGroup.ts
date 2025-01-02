import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { UserGroup } from "@/core/models";

export interface ICreateUserGroupForm {
    name: string;
}

export interface ICreateUserGroupResponse extends IRevertKeyBaseResponse {
    user_group: UserGroup.TModel;
}

const useCreateUserGroup = (revertCallback?: () => void, options?: TMutationOptions<ICreateUserGroupForm, ICreateUserGroupResponse>) => {
    const { mutate } = useQueryMutation();
    const { revert, createToastButton: createRevertToastButton } = useRevert(API_ROUTES.ACCOUNT.USER_GROUP.CREATE, revertCallback);

    const createUserGroup = async (params: ICreateUserGroupForm) => {
        const res = await api.post(API_ROUTES.ACCOUNT.USER_GROUP.CREATE, {
            name: params.name,
        });

        return {
            user_group: UserGroup.Model.fromObject(res.data.user_group),
            revert_key: res.data.revert_key,
        };
    };

    const result = mutate(["create-user-group"], createUserGroup, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useCreateUserGroup;
