import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ROUTES } from "@/core/routing/constants";

export interface IAddNewEmailForm {
    new_email: string;
    lang: string;
    is_resend?: bool;
}

export const SUB_EMAIL_VERIFY_TOKEN_QUERY_NAME = "bEvt";

const useAddNewEmail = (options?: TMutationOptions<IAddNewEmailForm>) => {
    const { mutate } = useQueryMutation();

    const addNewEmail = async (params: IAddNewEmailForm) => {
        const res = await api.post(API_ROUTES.ACCOUNT.EMAIL.CRUD, {
            ...params,
            url: `${window.location.origin}${ROUTES.ACCOUNT.EMAILS.VERIFY}`,
            verify_token_query_name: SUB_EMAIL_VERIFY_TOKEN_QUERY_NAME,
        });

        return res.data;
    };

    const result = mutate(["add-new-email"], addNewEmail, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useAddNewEmail;
