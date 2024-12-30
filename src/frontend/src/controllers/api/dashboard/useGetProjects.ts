import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";

export interface IGetProjectsResponse {
    all: Project.TModel[];
    starred: Project.TModel[];
    recent: Project.TModel[];
    unstarred: Project.TModel[];
}

const useGetProjects = (options?: TQueryOptions<unknown, IGetProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getProjects = async () => {
        try {
            const res = await api.get(`${API_ROUTES.DASHBOARD.PROJECTS}`);

            return {
                all: Project.Model.fromObjectArray(res.data.all),
                starred: Project.Model.fromObjectArray(res.data.starred),
                recent: Project.Model.fromObjectArray(res.data.recent),
                unstarred: Project.Model.fromObjectArray(res.data.unstarred),
            };
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
