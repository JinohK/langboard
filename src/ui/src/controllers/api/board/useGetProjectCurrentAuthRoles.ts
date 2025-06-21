/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectCurrentAuthRolesForm {
    uid: string;
}

export interface IGetProjectCurrentAuthRolesResponse {
    roles: Project.TRoleActions[];
}

const useGetProjectCurrentAuthRoles = (
    form: IGetProjectCurrentAuthRolesForm,
    options?: TQueryOptions<unknown, IGetProjectCurrentAuthRolesResponse>
) => {
    const { query } = useQueryMutation();

    const getProjectCurrentAuthRoles = async () => {
        const url = format(API_ROUTES.BOARD.CURRENT_AUTH_ROLES, { uid: form.uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return {
            roles: res.data.roles,
        };
    };

    const result = query([`get-project-current-auth-roles-${form.uid}`], getProjectCurrentAuthRoles, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProjectCurrentAuthRoles;
