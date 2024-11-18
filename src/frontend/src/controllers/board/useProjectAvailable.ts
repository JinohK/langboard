import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IProjectAvailableForm {
    uid: string;
}

export interface IBoardProject extends Project.Interface {
    members: User.Interface[];
    current_user_role_actions: Project.TRoleActions[];
}

const useProjectAvailable = (form: IProjectAvailableForm, options?: TQueryOptions<IBoardProject>) => {
    const { query } = useQueryMutation();

    const isProjectAvailable = async () => {
        const url = format(API_ROUTES.BOARD.IS_AVAILABLE, { uid: form.uid });
        const res = await api.post<{ project: Required<IBoardProject> }>(url);

        return res.data.project;
    };

    const result = query(["is-project-available"], isProjectAvailable, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useProjectAvailable;
