import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IVerifyNewEmailForm {
    verify_token: string;
}

const useVerifyNewEmail = (options?: TMutationOptions<IVerifyNewEmailForm>) => {
    const { mutate } = useQueryMutation();

    const verifyNewEmail = async (params: IVerifyNewEmailForm) => {
        const res = await api.post(API_ROUTES.ACCOUNT.EMAIL.VERIFY, params);

        return res.data;
    };

    const result = mutate(["verify-new-email"], verifyNewEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useVerifyNewEmail;
