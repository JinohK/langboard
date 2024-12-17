import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectForm {
    uid: string;
}

const useGetProjet = (form: IGetProjectForm, options?: TQueryOptions<Project.IBoard>) => {
    const { query } = useQueryMutation();

    const getProject = async () => {
        const url = format(API_ROUTES.BOARD.GET, { uid: form.uid });
        const res = await api.get<{ project: Required<Project.IBoard> }>(url);

        User.transformFromApi(res.data.project.members);
        User.transformFromApi(res.data.project.invited_users);

        return res.data.project;
    };

    const result = query([`get-project-${form.uid}`], getProject, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProjet;
