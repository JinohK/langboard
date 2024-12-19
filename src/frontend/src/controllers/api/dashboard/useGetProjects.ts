import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";

export interface IGetProjectsResponse {
    all: Project.IDashboard[];
    starred: Project.IDashboard[];
    recent: Project.IDashboard[];
    unstarred: Project.IDashboard[];
}

const useGetProjects = (options?: TQueryOptions<IGetProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getProjects = async () => {
        try {
            const res = await api.get(`${API_ROUTES.DASHBOARD.PROJECTS}`);

            return res.data;
        } catch (e) {
            if (!isAxiosError(e)) {
                throw e;
            }

            if (e.status === EHttpStatus.HTTP_404_NOT_FOUND) {
                return undefined;
            }
        }
    };

    const result = query(["get-dashboard-projects"], getProjects, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProjects;
