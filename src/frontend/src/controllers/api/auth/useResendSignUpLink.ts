import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IResendSignUpLinkForm {
    email: string;
    lang?: string;
}

const useResendSignUpLink = (options?: TMutationOptions<IResendSignUpLinkForm>) => {
    const { mutate } = useQueryMutation();

    const resendSignUpLink = async (params: IResendSignUpLinkForm) => {
        const res = await api.post(API_ROUTES.AUTH.SIGN_UP.RESEND_LINK, {
            ...params,
        });

        return res.data;
    };

    const result = mutate(["resend-sign-up-link"], resendSignUpLink, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useResendSignUpLink;
