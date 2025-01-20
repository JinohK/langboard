import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { UserGroup } from "@/core/models";

export interface ICreateUserGroupForm {
    name: string;
}

export interface ICreateUserGroupResponse {
    user_group: UserGroup.TModel;
}

const useCreateUserGroup = (options?: TMutationOptions<ICreateUserGroupForm, ICreateUserGroupResponse>) => {
    const { mutate } = useQueryMutation();

    const createUserGroup = async (params: ICreateUserGroupForm) => {
        const res = await api.post(API_ROUTES.ACCOUNT.USER_GROUP.CREATE, {
            name: params.name,
        });

        return {
            user_group: UserGroup.Model.fromObject(res.data.user_group),
        };
    };

    const result = mutate(["create-user-group"], createUserGroup, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateUserGroup;
