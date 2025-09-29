/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IVerifyNewEmailForm {
    verify_token: string;
}

const useVerifyNewEmail = (options?: TMutationOptions<IVerifyNewEmailForm>) => {
    const { mutate } = useQueryMutation();

    const verifyNewEmail = async (params: IVerifyNewEmailForm) => {
        const res = await api.post(Routing.API.ACCOUNT.EMAIL.VERIFY, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["verify-new-email"], verifyNewEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useVerifyNewEmail;
