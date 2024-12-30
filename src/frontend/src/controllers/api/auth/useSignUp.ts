import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";

export interface ISignUpForm extends Omit<User.Interface, "uid" | "username" | "avatar" | "groups"> {
    password: string;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    avatar?: File;
    lang?: string;
}

export const SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME = "sAVk";

const useSignUp = (options?: TMutationOptions<ISignUpForm>) => {
    const { mutate } = useQueryMutation();

    const signUp = async (params: ISignUpForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (key === "avatar") {
                formData.append(key, (value as unknown as File[])[0], (value as unknown as File[])[0].name);
            } else {
                formData.append(key, value);
            }
        });

        formData.append("url", `${window.location.origin}${ROUTES.SIGN_UP.ACTIVATE}`);
        formData.append("activate_token_query_name", SIGN_UP_ACTIVATE_TOKEN_QUERY_NAME);

        const res = await api.post(API_ROUTES.AUTH.SIGN_UP.SEND_LINK, formData);

        return res.data;
    };

    const result = mutate(["sign-up"], signUp, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useSignUp;
