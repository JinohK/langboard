import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteProjectForm {
    project_uid: string;
}

export interface IDeleteProjectResponse {}

const useDeleteProject = (options?: TMutationOptions<IDeleteProjectForm, IDeleteProjectResponse>) => {
    const { mutate } = useQueryMutation();

    const deleteProject = async (params: IDeleteProjectForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.DELETE_PROJECT, {
            uid: params.project_uid,
        });
        const res = await api.delete(url);
        return res.data;
    };

    const result = mutate(["delete-project"], deleteProject, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProject;
