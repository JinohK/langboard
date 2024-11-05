import { API_ROUTES } from "@/controllers/constants";
import { IRevertKeyBaseResponse } from "@/controllers/revert/useRevertMutate";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";

export interface IChangePrimaryEmailForm {
    email: string;
}

const useChangePrimaryEmail = (revertCallback?: () => void, options?: TMutationOptions<IChangePrimaryEmailForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { revert, createToastButton: createRevertToastButton } = useRevert(API_ROUTES.ACCOUNT.EMAIL.CRUD, revertCallback);

    const changePrimaryEmail = async (params: IChangePrimaryEmailForm) => {
        const res = await api.put(API_ROUTES.ACCOUNT.EMAIL.CRUD, params);

        return res.data;
    };

    const result = mutate(["change-primary-email"], changePrimaryEmail, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useChangePrimaryEmail;
