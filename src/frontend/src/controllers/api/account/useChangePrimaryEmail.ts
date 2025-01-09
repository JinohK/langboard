import { API_ROUTES } from "@/controllers/constants";
import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";

export interface IChangePrimaryEmailForm {
    email: string;
}

const useChangePrimaryEmail = (updatedUser: () => void, options?: TMutationOptions<IChangePrimaryEmailForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert(API_ROUTES.ACCOUNT.EMAIL.CRUD, updatedUser);

    const changePrimaryEmail = async (params: IChangePrimaryEmailForm) => {
        const res = await api.put(API_ROUTES.ACCOUNT.EMAIL.CRUD, params);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["change-primary-email"], changePrimaryEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangePrimaryEmail;
