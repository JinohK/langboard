/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface ISignInForm {
    sign_token: string;
    email_token: string;
    password: string;
}

interface ISignInResponse {
    access_token: string;
}

const useSignIn = (options?: TMutationOptions<ISignInForm, ISignInResponse>) => {
    const { mutate } = useQueryMutation();

    const signIn = async (params: ISignInForm) => {
        const res = await api.post(API_ROUTES.AUTH.SIGN_IN, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["signIn"], signIn, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useSignIn;
