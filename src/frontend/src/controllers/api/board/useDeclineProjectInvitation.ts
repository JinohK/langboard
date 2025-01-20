import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IDeclineProjectInvitationForm {
    token: string;
}

export interface IDeclineProjectInvitationResponse {}

const useDeclineProjectInvitation = (options?: TMutationOptions<IDeclineProjectInvitationForm, IDeclineProjectInvitationResponse>) => {
    const { mutate } = useQueryMutation();

    const declineProjectInvitation = async (params: IDeclineProjectInvitationForm) => {
        const res = await api.post(API_ROUTES.BOARD.DECLINE_INVITATION, {
            invitation_token: params.token,
        });

        return res.data;
    };

    const result = mutate(["decline-project-invitation"], declineProjectInvitation, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeclineProjectInvitation;
