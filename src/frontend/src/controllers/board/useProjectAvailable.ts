import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, ProjectColumn, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IProjectAvailableForm {
    uid: string;
}

interface IBoardProject extends Project.Interface {
    archive_column_name?: string;
    archive_column_order?: number;
    columns: ProjectColumn.Interface[];
    members: User.Interface[];
    current_user_role_actions: Project.TProjectRoleActions[];
}

export interface IProjectAvailableResponse {
    project: Required<Omit<IBoardProject, "archive_column_name" | "archive_column_order">>;
}

const useProjectAvailable = (options?: TMutationOptions<IProjectAvailableForm, IProjectAvailableResponse>) => {
    const { mutate } = useQueryMutation();

    const isProjectAvailable = async (params: IProjectAvailableForm) => {
        const url = format(API_ROUTES.BOARD.IS_AVAILABLE, { uid: params.uid });
        const res = await api.post<{ project: Required<IBoardProject> }>(url);

        const project: IBoardProject = { ...res.data.project };

        const columns: ProjectColumn.Interface[] = [
            ...project.columns.slice(0, res.data.project.archive_column_order),
            {
                uid: "archive",
                name: res.data.project.archive_column_name,
                order: res.data.project.archive_column_order,
            },
            ...project.columns.slice(res.data.project.archive_column_order),
        ];

        delete project.archive_column_name;
        delete project.archive_column_order;

        project.columns = columns;

        return { project };
    };

    const result = mutate(["is-project-available"], isProjectAvailable, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useProjectAvailable;
