import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

interface IBaseCheckEmailForm {
    login_token: string;
}

interface ICheckEmailFormWithToken extends IBaseCheckEmailForm {
    is_token: true;
    token: string;
}

interface ICheckEmailFormWithEmail extends IBaseCheckEmailForm {
    is_token: false;
    email: string;
}

interface ICheckEmailResponse {
    status: boolean;
    token: string;
}

export type TCheckEmailForm = ICheckEmailFormWithToken | ICheckEmailFormWithEmail;

const useCheckEmail = (options?: TMutationOptions<TCheckEmailForm, ICheckEmailResponse>) => {
    const { mutate } = useQueryMutation();

    const checkEmail = async (params: TCheckEmailForm) => {
        params.is_token = true;
        const res = await api.post(API_ROUTES.CHECK_EMAIL, params);

        return res.data;
    };

    const result = mutate(["check-email"], checkEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCheckEmail;
