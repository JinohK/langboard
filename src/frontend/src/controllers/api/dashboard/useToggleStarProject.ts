/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

interface IToggleStarProjectForm {
    uid: string;
}

const useToggleStarProject = (options?: TMutationOptions<IToggleStarProjectForm>) => {
    const { mutate } = useQueryMutation();

    const toggleStarProject = async (params: IToggleStarProjectForm) => {
        const url = format(API_ROUTES.DASHBOARD.TOGGLE_STAR_PROJECT, {
            uid: params.uid,
        });

        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["toggle-star-project"], toggleStarProject, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleStarProject;
