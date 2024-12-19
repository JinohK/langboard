import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectDetailsForm {
    uid: string;
}

const useGetProjetDetails = (form: IGetProjectDetailsForm, options?: TQueryOptions<Project.IBoardWithDetails>) => {
    const { query } = useQueryMutation();

    const getProjectDetails = async () => {
        const url = format(API_ROUTES.BOARD.GET, { uid: form.uid });
        const res = await api.get<{ project: Required<Project.IBoardWithDetails> }>(url);

        User.transformFromApi(res.data.project.members);
        User.transformFromApi(res.data.project.invited_users);

        return res.data.project;
    };

    const result = query([`get-project-details-${form.uid}`], getProjectDetails, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useGetProjetDetails;
