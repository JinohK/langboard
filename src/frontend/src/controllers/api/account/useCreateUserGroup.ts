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

const useCreateUserGroup = (options?: TMutationOptions<ICreateUserGroupForm, ICreateUserGroupResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert<string>(API_ROUTES.ACCOUNT.USER_GROUP.CREATE, (newGroupUID) => {
        UserGroup.Model.deleteModel(newGroupUID);
    });

    const createUserGroup = async (params: ICreateUserGroupForm) => {
        const res = await api.post(API_ROUTES.ACCOUNT.USER_GROUP.CREATE, {
            name: params.name,
        });

        const userGroup = UserGroup.Model.fromObject(res.data.user_group);

        return {
            user_group: userGroup,
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, res.data.user_group.uid),
        };
    };

    const result = mutate(["create-user-group"], createUserGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateUserGroup;
