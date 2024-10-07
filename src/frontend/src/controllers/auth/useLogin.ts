import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface ILoginForm {
    login_token: string;
    email_token: string;
    password: string;
}

interface ILoginResponse {
    access_token: string;
    refresh_token: string;
}

const useLogin = (options?: TMutationOptions<ILoginForm, ILoginResponse>) => {
    const { mutate } = useQueryMutation();

    const login = async (params: ILoginForm) => {
        const res = await api.post(API_ROUTES.LOGIN, params);

        return res.data;
    };

    const result = mutate(["login"], login, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useLogin;
