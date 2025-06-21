/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectUserRolesForm {
    project_uid: string;
    roles: Project.TRoleActions[];
}

const useUpdateProjectUserRoles = (userUID: string, options?: TMutationOptions<IUpdateProjectUserRolesForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectUserRoles = async (params: IUpdateProjectUserRolesForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.UPDATE_USER_ROLES, {
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
