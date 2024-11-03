import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IRecoveryPasswordForm {
    recovery_token: string;
    password: string;
}

const useRecoveryPassword = (options?: TMutationOptions<IRecoveryPasswordForm>) => {
    const { mutate } = useQueryMutation();

    const recoveryPassword = async (params: IRecoveryPasswordForm) => {
        const res = await api.post(API_ROUTES.AUTH.RECOVERY.RESET, params);

        return res.data;
    };

    const result = mutate(["recovery-password"], recoveryPassword, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useRecoveryPassword;
