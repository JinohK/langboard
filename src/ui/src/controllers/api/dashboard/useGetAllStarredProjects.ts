/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";

export interface IGetAllStarredProjectsResponse {
    projects: Project.TModel[];
}

const useGetAllStarredProjects = (options?: TQueryOptions<IGetAllStarredProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getAllStarredProjects = async () => {
        const res = await api.get(API_ROUTES.DASHBOARD.ALL_STARRED_PROJECTS, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return {
            projects: Project.Model.fromArray(res.data.projects, true),
        };
    };

    const result = query(["get-all-starred-projects"], getAllStarredProjects, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetAllStarredProjects;
