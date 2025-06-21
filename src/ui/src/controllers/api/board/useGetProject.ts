/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectForm {
    uid: string;
}

export interface IGetProjectResponse {
    project: Project.TModel;
}

const useGetProject = (form: IGetProjectForm, options?: TQueryOptions<unknown, IGetProjectResponse>) => {
    const { query } = useQueryMutation();

    const getProject = async () => {
        const url = format(API_ROUTES.BOARD.GET, { uid: form.uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        const project = Project.Model.fromObject(res.data.project);
        project.last_viewed_at = new Date();

        return {
            project,
        };
    };

    const result = query([`get-project-${form.uid}`], getProject, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProject;
