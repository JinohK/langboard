import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

export interface IDeleteSubEmailForm {
    email: string;
}

const useDeleteSubEmail = (options?: TMutationOptions<IDeleteSubEmailForm>) => {
    const { mutate } = useQueryMutation();

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

    return result;
};

export default useDeleteSubEmail;
