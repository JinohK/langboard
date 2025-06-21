/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IArchiveCardForm {
    project_uid: string;
    card_uid: string;
}

const useArchiveCard = (options?: TMutationOptions<IArchiveCardForm>) => {
    const { mutate } = useQueryMutation();

    const archiveCard = async (params: IArchiveCardForm) => {
        const url = format(API_ROUTES.BOARD.CARD.ARCHIVE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const res = await api.put(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["archive-card"], archiveCard, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useArchiveCard;
