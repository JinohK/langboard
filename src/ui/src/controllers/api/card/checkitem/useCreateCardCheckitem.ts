/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICreateCardCheckitemForm {
    project_uid: string;
    card_uid: string;
    checklist_uid: string;
    title: string;
}

const useCreateCardCheckitem = (options?: TMutationOptions<ICreateCardCheckitemForm>) => {
    const { mutate } = useQueryMutation();

    const createCheckitem = async (params: ICreateCardCheckitemForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CREATE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checklist_uid: params.checklist_uid,
        });
        const res = await api.post(
            url,
            {
                title: params.title,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["create-card-checkitem"], createCheckitem, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateCardCheckitem;
