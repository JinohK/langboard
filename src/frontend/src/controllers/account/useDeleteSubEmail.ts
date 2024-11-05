import { API_ROUTES } from "@/controllers/constants";
import { IRevertKeyBaseResponse } from "@/controllers/revert/useRevertMutate";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";

export interface IDeleteSubEmailForm {
    email: string;
}

const useDeleteSubEmail = (revertCallback?: () => void, options?: TMutationOptions<IDeleteSubEmailForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { revert, createToastButton: createRevertToastButton } = useRevert(API_ROUTES.ACCOUNT.EMAIL.CRUD, revertCallback);

    const deleteSubEmail = async (params: IDeleteSubEmailForm) => {
        const res = await api.delete(API_ROUTES.ACCOUNT.EMAIL.CRUD, {
            data: params,
        });

        return res.data;
    };

    const result = mutate(["delete-subemail"], deleteSubEmail, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useDeleteSubEmail;
