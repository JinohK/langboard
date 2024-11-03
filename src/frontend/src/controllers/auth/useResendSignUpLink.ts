import { SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME } from "@/controllers/auth/useSignUp";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ROUTES } from "@/core/routing/constants";

export interface IResendSignUpLinkForm {
    email: string;
    lang?: string;
}

const useResendSignUpLink = (options?: TMutationOptions<IResendSignUpLinkForm>) => {
    const { mutate } = useQueryMutation();

    const resendSignUpLink = async (params: IResendSignUpLinkForm) => {
        const res = await api.post(API_ROUTES.AUTH.SIGN_UP.RESEND_LINK, {
            ...params,
            url: `${window.location.origin}${ROUTES.SIGN_UP.ACTIVATE}`,
            activate_token_query_name: SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME,
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
