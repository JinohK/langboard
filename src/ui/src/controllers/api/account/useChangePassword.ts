/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IChangePasswordForm {
    current_password: string;
    new_password: string;
}

const useChangePassword = (options?: TMutationOptions<IChangePasswordForm>) => {
    const { mutate } = useQueryMutation();

    const changePassword = async (params: IChangePasswordForm) => {
        const res = await api.put(API_ROUTES.ACCOUNT.CHANGE_PASSWORD, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["change-password"], changePassword, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangePassword;
