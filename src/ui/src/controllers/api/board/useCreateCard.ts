/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCardForm {
    project_uid: string;
    column_uid: string;
    title: string;
    assign_users?: string[];
}

const useCreateCard = (options?: TMutationOptions<ICreateCardForm, { uid: string }>) => {
    const { mutate } = useQueryMutation();

    const createCard = async (params: ICreateCardForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                column_uid: params.column_uid,
                title: params.title,
                assign_users: params.assign_users,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return {
            uid: res.data.card.uid,
        };
    };

    const result = mutate(["create-card"], createCard, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCard;
