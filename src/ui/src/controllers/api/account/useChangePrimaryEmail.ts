/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IChangePrimaryEmailForm {
    email: string;
}

const useChangePrimaryEmail = (options?: TMutationOptions<IChangePrimaryEmailForm>) => {
    const { mutate } = useQueryMutation();

    const changePrimaryEmail = async (params: IChangePrimaryEmailForm) => {
        const res = await api.put(API_ROUTES.ACCOUNT.EMAIL.CRUD, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["change-primary-email"], changePrimaryEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangePrimaryEmail;
