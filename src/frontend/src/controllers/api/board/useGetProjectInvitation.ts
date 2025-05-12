import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectInvitationForm {
    token: string;
}

export interface IGetProjectInvitationResponse {
    project: {
        title: string;
    };
}

const useGetProjectInvitation = (options?: TMutationOptions<IGetProjectInvitationForm, IGetProjectInvitationResponse>) => {
    const { mutate } = useQueryMutation();

    const getProjectInvitation = async (form: IGetProjectInvitationForm) => {
        const url = format(API_ROUTES.BOARD.GET_INVITATION, { token: form.token });
        const res = await api.post(url);

        return res.data;
    };

    const result = mutate(["get-project-invitation"], getProjectInvitation, {
        ...options,
        retry: 0,
    });
    return result;
};

export default useGetProjectInvitation;
