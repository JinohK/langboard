import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { IProject } from "@/core/types";

export interface IGetAllStarredProjectsResponse {
    projects: IProject[];
    total: number;
}

const useGetAllStarredProjects = (options?: TQueryOptions<IGetAllStarredProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getAllStarredProjects = async () => {
        const res = await api.get(API_ROUTES.DASHBOARD.ALL_STARRED_PROJECTS);

        return res.data;
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
