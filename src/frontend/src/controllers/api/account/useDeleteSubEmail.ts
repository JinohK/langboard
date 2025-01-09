import { API_ROUTES } from "@/controllers/constants";
import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";

export interface IDeleteSubEmailForm {
    email: string;
}

const useDeleteSubEmail = (updatedUser: () => void, options?: TMutationOptions<IDeleteSubEmailForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert(API_ROUTES.ACCOUNT.EMAIL.CRUD, updatedUser);

    const deleteSubEmail = async (params: IDeleteSubEmailForm) => {
        const res = await api.delete(API_ROUTES.ACCOUNT.EMAIL.CRUD, {
            data: params,
        });

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["delete-subemail"], deleteSubEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSubEmail;
