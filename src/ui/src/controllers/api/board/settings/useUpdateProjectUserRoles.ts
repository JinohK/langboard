/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateProjectUserRolesForm {
    project_uid: string;
    roles: Project.TRoleActions[];
}

const useUpdateProjectUserRoles = (userUID: string, options?: TMutationOptions<IUpdateProjectUserRolesForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectUserRoles = async (params: IUpdateProjectUserRolesForm) => {
        const url = Utils.String.format(Routing.API.BOARD.SETTINGS.UPDATE_USER_ROLES, {
            uid: params.project_uid,
            user_uid: userUID,
        });
        const res = await api.put(
            url,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["update-project-user-roles"], updateProjectUserRoles, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectUserRoles;
