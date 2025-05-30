import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { deleteProjectModel } from "@/core/helpers/ModelHelper";
import ESocketTopic from "@/core/helpers/ESocketTopic";

export interface IGetProjectsResponse {
    projects: Project.TModel[];
}

const useGetProjects = (options?: TQueryOptions<unknown, IGetProjectsResponse>) => {
    const { query } = useQueryMutation();

    const getProjects = async () => {
        try {
            const res = await api.get(API_ROUTES.DASHBOARD.PROJECTS);

            const projects = Project.Model.fromObjectArray(res.data.projects, true);

            Project.Model.getModels((model) => !projects.some((project: Project.TModel) => project.uid === model.uid)).forEach((model) => {
                deleteProjectModel(ESocketTopic.Dashboard, model.uid);
            });

            return { projects };
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
