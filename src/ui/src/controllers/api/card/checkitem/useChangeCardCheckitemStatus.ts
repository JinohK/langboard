/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCheckitem } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardCheckitemStatusForm {
    project_uid: string;
    card_uid: string;
    checkitem_uid: string;
    status: ProjectCheckitem.ECheckitemStatus;
}

const useChangeCardCheckitemStatus = (options?: TMutationOptions<IChangeCardCheckitemStatusForm>) => {
    const { mutate } = useQueryMutation();

    const changeCheckitemStatus = async (params: IChangeCardCheckitemStatusForm) => {
        const url = format(API_ROUTES.BOARD.CARD.CHECKITEM.CHANGE_STATUS, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            checkitem_uid: params.checkitem_uid,
        });
        const res = await api.put(
            url,
            {
                status: params.status,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["change-card-checkitem-status"], changeCheckitemStatus, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardCheckitemStatus;
