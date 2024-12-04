import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IValidateRecoveryTokenForm {
    recovery_token: string;
}

interface IValidateRecoveryTokenResponse {
    email: string;
}

const useValidateRecoveryToken = (options?: TMutationOptions<IValidateRecoveryTokenForm, IValidateRecoveryTokenResponse>) => {
    const { mutate } = useQueryMutation();

    const validateRecoveryToken = async (params: IValidateRecoveryTokenForm) => {
        const res = await api.post(API_ROUTES.AUTH.RECOVERY.VALIDATE, params);

        return res.data;
    };

    const result = mutate(["validate-recovery-token"], validateRecoveryToken, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useValidateRecoveryToken;
